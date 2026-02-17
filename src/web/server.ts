import Fastify, { FastifyInstance } from 'fastify';
import fastifyView from '@fastify/view';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyFormbody from '@fastify/formbody';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { DatabaseConnection } from '../db/connection';
import { PasswordUtil } from '../utils/password';
import { Admin } from '../domain/entities/Admin';

// Repositories
import {
    VoterRepository,
    ElectionRepository,
    CandidateRepository,
    BallotRepository,
    VoterEligibilityRepository,
    VoteConfirmationRepository,
    AdminRepository
} from '../repositories';
import { TieResolutionRepository } from '../repositories/TieResolutionRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';

// Services
import { VoterService } from '../services/VoterService';
import { ElectionService } from '../services/ElectionService';
import { VotingService } from '../services/VotingService';
import { ElectionScheduler } from '../services/ElectionScheduler';

// Controllers
import { VoterController } from '../controllers/VoterController';
import { ElectionController } from '../controllers/ElectionController';
import { VotingController } from '../controllers/VotingController';
import {
    AdminAuthController,
    AdminDashboardController,
    AdminElectionController,
    AdminVoterController,
    AdminUserController,
    AdminSettingsController
} from '../controllers/admin';

// Routes
import { voterRoutes } from './routes/voter.routes';
import { electionRoutes } from './routes/election.routes';
import { votingRoutes } from './routes/voting.routes';
import { adminRoutes, AdminControllers } from './routes/admin.routes';

export async function createServer(): Promise<FastifyInstance> {
    const fastify = Fastify({
        logger: true
    });

    // Register form body parser (for HTML form submissions)
    await fastify.register(fastifyFormbody);

    // Register cookie plugin (required by session)
    await fastify.register(fastifyCookie);

    // Register session plugin
    await fastify.register(fastifySession, {
        secret: config.session.secret,
        cookieName: config.session.cookieName,
        cookie: {
            secure: false // Set to true in production with HTTPS
        }
    });

    // Register view engine
    await fastify.register(fastifyView, config.views);

    // Register static file serving
    await fastify.register(fastifyStatic, {
        root: config.static.root,
        prefix: '/public/'
    });

    // Create settings repository early for use in hooks
    const settingsRepository = new SettingsRepository();
    
    // Override reply.view to automatically merge locals
    fastify.addHook('onRequest', async (_request, reply) => {
        reply.locals = {
            voterID: null,
            voterName: null,
            isAdmin: false,
            adminUsername: null
        };
        const originalView = reply.view.bind(reply);
        reply.view = function(template: string, data?: object) {
            const mergedData = { ...reply.locals, ...data };
            return originalView(template, mergedData);
        } as typeof reply.view;
    });

    // Add hook to pass session data and settings to all views
    fastify.addHook('preHandler', async (request, reply) => {
        const settings = settingsRepository.getAll();
        
        // Check maintenance mode - block non-admin users from most routes
        if (settings.maintenanceMode && !request.session.isAdmin) {
            const url = request.url;
            // Allow admin routes and static files
            if (!url.startsWith('/admin') && !url.startsWith('/public')) {
                return reply.status(503).view('maintenance.ejs', {
                    title: 'Under Maintenance',
                    message: settings.maintenanceMessage || 'We are currently performing maintenance. Please check back later.'
                });
            }
        }
        
        // Make session data and settings available to all templates
        reply.locals = {
            voterID: request.session.voterID || null,
            voterName: request.session.voterName || null,
            isAdmin: request.session.isAdmin || false,
            adminUsername: request.session.adminUsername || null,
            siteBanner: settings.bannerEnabled ? {
                message: settings.bannerMessage,
                type: settings.bannerType
            } : null,
            signupEnabled: settings.signupEnabled,
            loginEnabled: settings.loginEnabled,
            testMode: process.env.NODE_ENV === 'test'
        };
    });

    // Dependency Injection: Create repository instances
    const voterRepository = new VoterRepository();
    const electionRepository = new ElectionRepository();
    const candidateRepository = new CandidateRepository();
    const ballotRepository = new BallotRepository();
    const eligibilityRepository = new VoterEligibilityRepository();
    const confirmationRepository = new VoteConfirmationRepository();
    const adminRepository = new AdminRepository();
    const tieResolutionRepository = new TieResolutionRepository();
    // settingsRepository created above

    // Ensure at least one admin exists
    const admins = adminRepository.findAll();
    if (admins.length === 0) {
        const defaultPassword = process.env.CONSENSUS_ADMIN_DEFAULT_PASSWORD || 'admin123';
        const passwordHash = await PasswordUtil.hash(defaultPassword);
        const admin = new Admin(
            uuidv4(),
            'admin',
            passwordHash,
            'Administrator',
            new Date(),
            true // mustChangePassword
        );
        adminRepository.save(admin);
        console.log('Created default admin user (username: admin)');
    }

    // Dependency Injection: Create service instances
    const voterService = new VoterService(voterRepository);
    const electionService = new ElectionService(electionRepository, candidateRepository);
    const votingService = new VotingService(
        ballotRepository,
        eligibilityRepository,
        confirmationRepository,
        electionRepository,
        candidateRepository
    );

    // Start election scheduler (auto-start/close elections based on dates)
    const scheduler = new ElectionScheduler(electionService, 60000); // Check every minute
    scheduler.start();

    // Dependency Injection: Create controller instances
    const voterController = new VoterController(voterService, electionService, votingService, settingsRepository);
    const electionController = new ElectionController(electionService, votingService, tieResolutionRepository, voterService, settingsRepository);
    const votingController = new VotingController(votingService, voterService, electionService, settingsRepository);
    
    // Admin controllers (split for maintainability)
    const adminControllers: AdminControllers = {
        auth: new AdminAuthController(adminRepository),
        dashboard: new AdminDashboardController(electionService, voterService, votingService),
        election: new AdminElectionController(electionService, votingService, tieResolutionRepository),
        voter: new AdminVoterController(voterService),
        user: new AdminUserController(adminRepository),
        settings: new AdminSettingsController(settingsRepository)
    };

    // Register routes
    await voterRoutes(fastify, voterController);
    await electionRoutes(fastify, electionController);
    await votingRoutes(fastify, votingController);
    await adminRoutes(fastify, adminControllers);

    // Home route
    fastify.get('/', async (request, reply) => {
        // Redirect logged-in admins to admin dashboard
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }
        
        // Redirect logged-in voters to voter dashboard
        if (request.session.voterID) {
            return reply.redirect('/dashboard');
        }
        
        const query = request.query as any;
        return reply.view('home.ejs', {
            title: 'Consensus - Electronic Voting System',
            deleted: query.deleted === '1'
        });
    });

    // Custom 404 handler
    fastify.setNotFoundHandler(async (_request, reply) => {
        return reply.status(404).view('404.ejs', {
            title: 'Page Not Found'
        });
    });

    // Custom error handler
    fastify.setErrorHandler(async (error, _request, reply) => {
        const err = error as Error & { statusCode?: number };
        const statusCode = err.statusCode || 500;
        
        // Log the error
        fastify.log.error(error);
        
        // Don't expose internal errors in production
        const message = statusCode === 500 
            ? 'An unexpected error occurred. Please try again later.'
            : err.message;
        
        return reply.status(statusCode).view('error.ejs', {
            title: statusCode === 500 ? 'Server Error' : 'Error',
            error: message
        });
    });

    return fastify;
}

export async function startServer(): Promise<void> {
    try {
        const db = DatabaseConnection.getInstance();

        // Run database migrations
        DatabaseConnection.runMigrations();
        
        const server = await createServer();
        
        await server.listen({
            host: config.server.host,
            port: config.server.port
        });

        console.log(`Consensus E-Voting System running on http://${config.server.host}:${config.server.port}`);
        
        // Log system data using repositories
        console.log('\n=== System Data ===');
        
        const voterRepo = new VoterRepository(db);
        const electionRepo = new ElectionRepository(db);
        const candidateRepo = new CandidateRepository(db);
        const adminRepo = new AdminRepository(db);
        
        // Log admins
        const admins = adminRepo.findAll();
        console.log(`\nAdmins (${admins.length}):`);
        admins.forEach(a => {
            console.log(`  - ${a.username} (${a.name})`);
        });
        
        // Log voters
        const voters = voterRepo.findAll();
        console.log(`\nVoters (${voters.length}):`);
        voters.forEach(v => {
            console.log(`  - ${v.name} (${v.email}) [${v.registrationStatus}]`);
        });
        
        // Log elections
        const elections = electionRepo.findAll();
        console.log(`\nElections (${elections.length}):`);
        elections.forEach(e => {
            console.log(`  - ${e.name} [${e.electionType}] - Status: ${e.status}`);
        });
        
        // Log candidates
        const allCandidates = elections.flatMap(e => candidateRepo.findByElectionId(e.electionID));
        console.log(`\nCandidates (${allCandidates.length}):`);
        allCandidates.forEach(c => {
            const election = elections.find(e => e.electionID === c.electionID);
            console.log(`  - ${c.name} (${c.party}) - ${election?.name}`);
        });

        if (voters.length === 0 && elections.length === 0 && allCandidates.length === 0 && admins.length === 0) {
            console.log('\n(!!!) No data found. Run `yarn db:seed` to populate the database with sample data.');
        }
        
        console.log('\n==================\n');
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}
