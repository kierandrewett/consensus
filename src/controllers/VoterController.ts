import { FastifyRequest, FastifyReply } from 'fastify';
import { VoterService, VoterRegistrationDTO } from '../services/VoterService';
import { ElectionService } from '../services/ElectionService';
import { VotingService } from '../services/VotingService';
import { ValidationUtil } from '../utils/validation';
import { PasswordUtil } from '../utils/password';
import { TurnstileUtil } from '../utils/turnstile';
import { SettingsRepository } from '../repositories/SettingsRepository';

export class VoterController {
    constructor(
        private voterService: VoterService,
        private electionService?: ElectionService,
        private votingService?: VotingService,
        private settingsRepository?: SettingsRepository
    ) {}

    /**
     * Display registration form
     */
    async showRegistrationForm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter pages
        if (request.session.isAdmin) {
            return reply.redirect('/admin');
        }

        // Already logged in as voter
        if (request.session.voterID) {
            return reply.redirect('/dashboard');
        }

        // Check if registration is enabled
        const settings = this.settingsRepository?.getAll();
        const signupEnabled = settings?.signupEnabled ?? true;

        const error = request.session.get('registrationError') || null;
        const formName = request.session.get('registrationFormName') || '';
        const formEmail = request.session.get('registrationFormEmail') || '';
        request.session.set('registrationError', undefined);
        request.session.set('registrationFormName', undefined);
        request.session.set('registrationFormEmail', undefined);
        
        // Get Turnstile settings (skip in development/test mode)
        const skipTurnstile = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        
        return reply.view('voter/register.ejs', {
            title: 'Voter Registration',
            error,
            formName,
            formEmail,
            signupEnabled,
            turnstileEnabled: skipTurnstile ? false : (settings?.turnstileEnabled ?? false),
            turnstileSiteKey: settings?.turnstileSiteKey ?? ''
        });
    }

    /**
     * Handle voter registration
     */
    async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot register as voters
        if (request.session.isAdmin) {
            return reply.redirect('/admin');
        }

        // Already logged in as voter
        if (request.session.voterID) {
            return reply.redirect('/dashboard');
        }

        // Check if registration is enabled
        const settings = this.settingsRepository?.getAll();
        const signupEnabled = settings?.signupEnabled ?? true;
        if (!signupEnabled) {
            request.session.set('registrationError', 'Registration is currently disabled');
            return reply.redirect('/register');
        }

        const body = request.body as any;

        try {
            // Verify Turnstile if enabled (skip in development/test mode)
            const skipTurnstile = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
            if (!skipTurnstile && settings?.turnstileEnabled && settings.turnstileSecretKey) {
                const turnstileToken = body['cf-turnstile-response'];
                const ip = Array.isArray(request.ip) ? request.ip[0] : request.ip;
                const isValid = await TurnstileUtil.verify(turnstileToken, settings.turnstileSecretKey, ip);
                if (!isValid) {
                    throw new Error('CAPTCHA verification failed. Please try again.');
                }
            }

            // Validate input
            if (!body.name || !body.email || !body.password) {
                throw new Error('All fields are required');
            }

            if (!ValidationUtil.isValidEmail(body.email)) {
                throw new Error('Invalid email format');
            }

            // Hash password
            const passwordHash = await PasswordUtil.hash(body.password);

            // Check if auto-approval is enabled
            const autoApprovalEnabled = this.settingsRepository?.getAll().autoApprovalEnabled ?? false;

            // Register voter
            const dto: VoterRegistrationDTO = {
                name: ValidationUtil.sanitize(body.name),
                email: body.email.toLowerCase(),
                password: passwordHash
            };

            const voter = this.voterService.registerVoter(dto, autoApprovalEnabled);

            // Log the user in automatically
            request.session.voterID = voter.voterID;
            request.session.voterName = voter.name;

            // Store success data in session and redirect to success page
            request.session.set('registrationSuccess', true);
            request.session.set('newVoterID', voter.voterID);
            return reply.redirect('/registration-success');
        } catch (error: any) {
            // Store error and form data in session and redirect
            request.session.set('registrationError', error.message);
            request.session.set('registrationFormName', body.name || '');
            request.session.set('registrationFormEmail', body.email || '');
            return reply.redirect('/register');
        }
    }

    /**
     * Display login form
     */
    async showLoginForm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter login
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        // Already logged in as voter
        if (request.session.voterID) {
            return reply.redirect('/dashboard');
        }

        // Check if login is enabled
        const loginEnabled = this.settingsRepository?.getAll().loginEnabled ?? true;

        const error = request.session.get('loginError') || null;
        request.session.set('loginError', undefined);
        
        // Get redirect destination from query param
        const query = request.query as any;
        const redirectTo = query.to || null;
        
        return reply.view('voter/login.ejs', {
            title: 'Voter Login',
            error,
            redirectTo,
            loginEnabled
        });
    }

    /**
     * Handle voter login
     */
    async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot login as voters
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        // Already logged in as voter
        if (request.session.voterID) {
            return reply.redirect('/dashboard');
        }

        // Check if login is enabled
        const loginEnabled = this.settingsRepository?.getAll().loginEnabled ?? true;
        if (!loginEnabled) {
            request.session.set('loginError', 'Login is currently disabled');
            return reply.redirect('/login');
        }

        const body = request.body as any;

        try {
            if (!body.email || !body.password) {
                throw new Error('Email and password are required');
            }

            const voter = this.voterService.getVoterByEmail(body.email.toLowerCase());
            if (!voter) {
                throw new Error('Invalid email or password');
            }

            const isValid = await PasswordUtil.verify(body.password, voter.passwordHash);
            if (!isValid) {
                throw new Error('Invalid email or password');
            }

            // Set session
            request.session.voterID = voter.voterID;
            request.session.voterName = voter.name;

            // Redirect to intended destination or dashboard
            const redirectTo = body.redirectTo;
            if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
                return reply.redirect(redirectTo);
            }
            return reply.redirect('/dashboard');
        } catch (error: any) {
            request.session.set('loginError', error.message);
            const redirectTo = body.redirectTo;
            if (redirectTo) {
                return reply.redirect(`/login?to=${encodeURIComponent(redirectTo)}`);
            }
            return reply.redirect('/login');
        }
    }

    /**
     * Display voter dashboard
     */
    async showDashboard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter dashboard
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        const voterID = request.session.voterID;
        if (!voterID) {
            return reply.redirect('/login');
        }

        const voter = this.voterService.getVoterById(voterID);
        if (!voter) {
            return reply.redirect('/login');
        }

        // Get available elections and voting history for approved voters
        let availableElections: any[] = [];
        let recentVotes: any[] = [];
        let votedCount = 0;

        if (voter.registrationStatus === 'APPROVED' && this.electionService && this.votingService) {
            const activeElections = this.electionService.getActiveElections();
            const now = new Date();
            
            // Filter to elections the voter hasn't voted in yet and are currently open
            availableElections = activeElections.filter(e => {
                const hasVoted = this.votingService!.hasVoted(voterID, e.electionID);
                const isOpen = now >= e.startDate && now <= e.endDate;
                return !hasVoted && isOpen;
            });
            
            // Get recent confirmations with election names
            const confirmations = this.votingService.getVoterConfirmations(voterID);
            recentVotes = confirmations.slice(0, 5).map(c => {
                const election = this.electionService!.getElectionById(c.electionID);
                return {
                    electionName: election?.name || 'Unknown Election',
                    timestamp: c.confirmedAt,
                    confirmationCode: c.getConfirmationCode()
                };
            });
            votedCount = confirmations.length;
        }

        return reply.view('voter/dashboard.ejs', {
            title: 'Dashboard',
            voter,
            availableElections,
            recentVotes,
            votedCount
        });
    }

    /**
     * Display registration success page
     */
    async showRegistrationSuccess(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter pages
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        const success = request.session.get('registrationSuccess');
        const voterID = request.session.get('newVoterID');
        
        if (!success || !voterID) {
            return reply.redirect('/register');
        }
        
        const voter = this.voterService.getVoterById(voterID);
        if (!voter) {
            return reply.redirect('/register');
        }
        
        // Clear session data
        request.session.set('registrationSuccess', undefined);
        request.session.set('newVoterID', undefined);
        
        return reply.view('voter/registration-success.ejs', {
            title: 'Registration Successful',
            voter
        });
    }

    /**
     * Handle logout
     */
    async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        request.session.destroy((err: any) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            reply.redirect('/');
        });
    }

    /**
     * Display profile page
     */
    async showProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter pages
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        const voterID = request.session.voterID;
        if (!voterID) {
            return reply.redirect('/login');
        }

        const voter = this.voterService.getVoterById(voterID);
        if (!voter) {
            return reply.redirect('/login');
        }

        const error = request.session.get('profileError') || null;
        const success = request.session.get('profileSuccess') || null;
        request.session.set('profileError', undefined);
        request.session.set('profileSuccess', undefined);

        return reply.view('voter/profile.ejs', {
            title: 'My Profile',
            voter,
            error,
            success
        });
    }

    /**
     * Handle profile update
     */
    async updateProfile(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter pages
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        const voterID = request.session.voterID;
        if (!voterID) {
            return reply.redirect('/login');
        }

        const body = request.body as any;

        try {
            const voter = this.voterService.getVoterById(voterID);
            if (!voter) {
                throw new Error('Voter not found');
            }

            const updates: { name?: string; email?: string; passwordHash?: string } = {};

            // Update name if provided
            if (body.name && body.name.trim() !== voter.name) {
                updates.name = ValidationUtil.sanitize(body.name);
            }

            // Update email if provided
            if (body.email && body.email.toLowerCase() !== voter.email) {
                if (!ValidationUtil.isValidEmail(body.email)) {
                    throw new Error('Invalid email format');
                }
                updates.email = body.email.toLowerCase();
            }

            // Update password if provided
            if (body.newPassword) {
                // Verify current password
                if (!body.currentPassword) {
                    throw new Error('Current password is required to change password');
                }

                const isValidPassword = await PasswordUtil.verify(body.currentPassword, voter.passwordHash);
                if (!isValidPassword) {
                    throw new Error('Current password is incorrect');
                }

                updates.passwordHash = await PasswordUtil.hash(body.newPassword);
            }

            // Only update if there are changes
            if (Object.keys(updates).length > 0) {
                const updatedVoter = this.voterService.updateVoter(voterID, updates);
                
                // Update session name if changed
                if (updates.name) {
                    request.session.voterName = updatedVoter.name;
                }

                request.session.set('profileSuccess', 'Profile updated successfully');
            } else {
                request.session.set('profileSuccess', 'No changes to save');
            }

            return reply.redirect('/profile');
        } catch (error: any) {
            request.session.set('profileError', error.message);
            return reply.redirect('/profile');
        }
    }

    /**
     * Handle account deletion (GDPR)
     */
    async deleteAccount(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        // Admins cannot access voter pages
        if (request.session.isAdmin) {
            return reply.redirect('/admin/dashboard');
        }

        const voterID = request.session.voterID;
        if (!voterID) {
            return reply.redirect('/login');
        }

        const body = request.body as any;

        try {
            const voter = this.voterService.getVoterById(voterID);
            if (!voter) {
                throw new Error('Voter not found');
            }

            // Verify password before deletion
            if (!body.password) {
                throw new Error('Password is required to delete your account');
            }

            const isValidPassword = await PasswordUtil.verify(body.password, voter.passwordHash);
            if (!isValidPassword) {
                throw new Error('Password is incorrect');
            }

            // Delete the account
            this.voterService.deleteVoter(voterID);

            // Destroy session and redirect
            request.session.destroy((err: any) => {
                if (err) {
                    console.error('Session destruction error:', err);
                }
                reply.redirect('/?deleted=1');
            });
        } catch (error: any) {
            request.session.set('profileError', error.message);
            return reply.redirect('/profile');
        }
    }
}
