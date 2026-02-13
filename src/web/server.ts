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

    // Register form body parser
    await fastify.register(fastifyFormbody);

    // Register cookie plugin (required by session)
    await fastify.register(fastifyCookie);

    // Register session plugin
    await fastify.register(fastifySession, {
        secret: config.session.secret,
        cookieName: config.session.cookieName,
        cookie: {
            secure: false
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

    // Dependency Injection: Create repository instances
    const voterRepository = new VoterRepository();
    const electionRepository = new ElectionRepository();
    const candidateRepository = new CandidateRepository();
    const ballotRepository = new BallotRepository();
    const eligibilityRepository = new VoterEligibilityRepository();
    const confirmationRepository = new VoteConfirmationRepository();
    const adminRepository = new AdminRepository();
    const tieResolutionRepository = new TieResolutionRepository();

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

    // Dependency Injection: Create controller instances
    const voterController = new VoterController(voterService, electionService, votingService, settingsRepository);
    const electionController = new ElectionController(electionService, votingService, tieResolutionRepository, voterService, settingsRepository);
    const votingController = new VotingController(votingService, voterService, electionService, settingsRepository);

    // Register routes
    await voterRoutes(fastify, voterController);
    await electionRoutes(fastify, electionController);
    await votingRoutes(fastify, votingController);

    return fastify;
}
