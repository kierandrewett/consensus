import { FastifyRequest, FastifyReply } from 'fastify';
import { VotingService, CastVoteDTO } from '../services/VotingService';
import { VoterService } from '../services/VoterService';
import { ElectionService } from '../services/ElectionService';
import { ElectionType } from '../domain/enums';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { TurnstileUtil } from '../utils/turnstile';
import { createHash } from 'crypto';

export class VotingController {
    constructor(
        private votingService: VotingService,
        private voterService: VoterService,
        private electionService: ElectionService,
        private settingsRepository?: SettingsRepository
    ) {}

    /**
     * Check if an IP address is private/local
     */
    private isPrivateIP(ip: string): boolean {
        // Handle IPv6 localhost
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
            return true;
        }
        
        // Remove IPv6 prefix if present
        const cleanIP = ip.replace(/^::ffff:/, '');
        
        // Check for localhost
        if (cleanIP === 'localhost' || cleanIP === '127.0.0.1') {
            return true;
        }
        
        // Parse IPv4
        const parts = cleanIP.split('.').map(Number);
        if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
            // Not a valid IPv4, could be IPv6 or invalid - treat as private for safety
            return true;
        }
        
        const [a, b] = parts;
        
        // 10.0.0.0 - 10.255.255.255 (Class A private)
        if (a === 10) return true;
        
        // 172.16.0.0 - 172.31.255.255 (Class B private)
        if (a === 172 && b >= 16 && b <= 31) return true;
        
        // 192.168.0.0 - 192.168.255.255 (Class C private)
        if (a === 192 && b === 168) return true;
        
        // 169.254.0.0 - 169.254.255.255 (link-local)
        if (a === 169 && b === 254) return true;
        
        // 127.0.0.0 - 127.255.255.255 (loopback)
        if (a === 127) return true;
        
        // 0.0.0.0 - 0.255.255.255 (current network)
        if (a === 0) return true;
        
        return false;
    }

    /**
     * Get or create a guest voter from IP address
     */
    private getOrCreateGuestVoter(request: FastifyRequest): { voterID: string; name: string } | { error: string } {
        const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        const ipString = Array.isArray(ip) ? ip[0] : ip;
        
        // Validate that IP is public (skip in development/test mode)
        const skipIPCheck = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        if (!skipIPCheck && this.isPrivateIP(ipString)) {
            return { 
                error: `Guest voting requires a public IP address. Detected private/local IP: ${ipString}. This usually indicates a reverse proxy configuration issue - ensure X-Forwarded-For header is being set correctly.` 
            };
        }
        
        const hashedIP = createHash('sha256').update(ipString).digest('hex').substring(0, 16);
        const guestEmail = `guest_${hashedIP}@guest.local`;
        
        // Check if guest voter already exists
        let voter = this.voterService.getVoterByEmail(guestEmail);
        if (voter) {
            return { voterID: voter.voterID, name: voter.name };
        }
        
        // Create new guest voter (auto-approved since guest voting requires auto-approval)
        try {
            voter = this.voterService.registerVoter({
                name: `Guest (${hashedIP.substring(0, 8)})`,
                email: guestEmail,
                password: createHash('sha256').update(hashedIP + Date.now()).digest('hex')
            }, true); // Auto-approve
            return { voterID: voter.voterID, name: voter.name };
        } catch {
            return { error: 'Failed to create guest voter account.' };
        }
    }

    /**
     * Display voting form for an election
     */
    async showVotingForm(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const { electionID } = request.params as any;
        let voterID = request.session.voterID;
        let voter = voterID ? this.voterService.getVoterById(voterID) : null;
        let isGuest = false;
        
        // Check if guest voting is enabled
        const guestVotingEnabled = this.settingsRepository?.getAll().guestVotingEnabled ?? false;
        
        if (!voter && guestVotingEnabled) {
            // Try to create/get guest voter
            const guestResult = this.getOrCreateGuestVoter(request);
            if ('error' in guestResult) {
                return reply.status(400).view('error.ejs', {
                    title: 'Guest Voting Error',
                    error: guestResult.error
                });
            }
            voterID = guestResult.voterID;
            voter = this.voterService.getVoterById(voterID);
            isGuest = true;
            // Store in session for the vote submission
            request.session.set('guestVoterID', voterID);
        }
        
        if (!voterID || !voter) {
            return reply.redirect(`/login?to=/vote/${electionID}`);
        }

        // Check voter is approved (guests are auto-approved)
        if (!voter.isApproved()) {
            return reply.status(403).view('error.ejs', {
                title: 'Not Approved',
                error: 'Your voter registration has not been approved yet. Please wait for an administrator to approve your registration before voting.'
            });
        }

        const election = this.electionService.getElectionById(electionID);
        if (!election) {
            return reply.status(404).view('error.ejs', {
                title: 'Not Found',
                error: 'Election not found'
            });
        }

        // Check election is active
        if (election.status !== 'ACTIVE') {
            return reply.status(403).view('error.ejs', {
                title: 'Election Not Available',
                error: 'This election is not currently open for voting.'
            });
        }

        // Check election dates
        const now = new Date();
        if (now < election.startDate) {
            return reply.status(403).view('error.ejs', {
                title: 'Election Not Started',
                error: `This election has not started yet. Voting opens on ${election.startDate.toLocaleString()}.`
            });
        }
        if (now > election.endDate) {
            return reply.status(403).view('error.ejs', {
                title: 'Election Closed',
                error: 'This election has ended and is no longer accepting votes.'
            });
        }

        // Check if already voted
        if (this.votingService.hasVoted(voterID, electionID)) {
            return reply.view('voting/already-voted.ejs', {
                title: 'Already Voted',
                election
            });
        }

        const candidates = this.electionService.getCandidates(electionID);

        // Check for error from POST redirect
        const error = request.session.get('voteError') || null;
        request.session.set('voteError', undefined);

        // Get Turnstile settings (skip in development/test mode)
        const settings = this.settingsRepository?.getAll();
        const skipTurnstile = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
        const turnstileEnabled = skipTurnstile ? false : (settings?.turnstileEnabled ?? false);
        const turnstileSiteKey = settings?.turnstileSiteKey ?? '';

        return reply.view('voting/vote.ejs', {
            title: `Vote in ${election.name}`,
            election,
            candidates,
            voter,
            error,
            isGuest,
            turnstileEnabled,
            turnstileSiteKey
        });
    }

    /**
     * Cast a vote
     */
    async castVote(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        let voterID = request.session.voterID;
        
        // Check for guest voter
        const settings = this.settingsRepository?.getAll();
        const guestVotingEnabled = settings?.guestVotingEnabled ?? false;
        if (!voterID && guestVotingEnabled) {
            voterID = request.session.get('guestVoterID');
        }
        
        if (!voterID) {
            return reply.redirect('/login');
        }

        const { electionID } = request.params as any;
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

            const voter = this.voterService.getVoterById(voterID);
            if (!voter) {
                throw new Error('Voter not found');
            }

            // Check voter is approved
            if (!voter.isApproved()) {
                return reply.status(403).view('error.ejs', {
                    title: 'Not Approved',
                    error: 'Your voter registration has not been approved yet. Please wait for an administrator to approve your registration before voting.'
                });
            }

            const election = this.electionService.getElectionById(electionID);
            if (!election) {
                throw new Error('Election not found');
            }

            // Prepare vote data based on election type
            const dto: CastVoteDTO = {
                voterID,
                electionID
            };

            if (election.electionType === ElectionType.FPTP) {
                // FPTP: single candidate selection
                dto.candidateID = body.candidateID;
            } else {
                // STV/AV: ranked preferences
                // Parse preferences if it's a JSON string (from form submission)
                let preferences = body.preferences || [];
                if (typeof preferences === 'string') {
                    try {
                        preferences = JSON.parse(preferences);
                    } catch {
                        preferences = [];
                    }
                }
                dto.preferences = preferences;
            }

            // Cast vote and get confirmation
            const confirmation = this.votingService.castVote(voter, dto);

            // Store confirmation in session and redirect (Post/Redirect/Get pattern)
            request.session.set('voteConfirmation', {
                confirmationID: confirmation.confirmationID,
                electionID: confirmation.electionID,
                confirmedAt: confirmation.confirmedAt.toISOString()
            });

            return reply.redirect(`/vote/${electionID}/confirmed`);
        } catch (error: any) {
            // Store error in session and redirect (Post/Redirect/Get pattern)
            request.session.set('voteError', error.message);
            return reply.redirect(`/vote/${electionID}`);
        }
    }

    /**
     * Show vote confirmation page (GET after POST redirect)
     */
    async showConfirmation(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        let voterID = request.session.voterID;
        const guestVoterID = request.session.get('guestVoterID');
        const isGuest = !voterID && !!guestVoterID;
        
        if (!voterID && guestVoterID) {
            voterID = guestVoterID;
        }
        
        if (!voterID) {
            return reply.redirect('/login');
        }

        const { electionID } = request.params as any;
        const confirmationData = request.session.get('voteConfirmation');

        if (!confirmationData || confirmationData.electionID !== electionID) {
            return reply.redirect('/elections');
        }

        // Clear confirmation from session
        request.session.set('voteConfirmation', undefined);

        const election = this.electionService.getElectionById(electionID);
        if (!election) {
            return reply.redirect('/elections');
        }

        // Reconstruct confirmation object
        const confirmation = {
            confirmationID: confirmationData.confirmationID,
            voterID,
            electionID: confirmationData.electionID,
            confirmedAt: new Date(confirmationData.confirmedAt)
        };

        return reply.view('voting/confirmation.ejs', {
            title: 'Vote Confirmation',
            election,
            confirmation,
            isGuest
        });
    }

    /**
     * View voter's confirmations
     */
    async viewConfirmations(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const voterID = request.session.voterID;
        if (!voterID) {
            return reply.redirect('/login');
        }

        const confirmations = this.votingService.getVoterConfirmations(voterID);

        // Enrich confirmations with election names
        const enrichedConfirmations = confirmations.map(conf => {
            const election = this.electionService.getElectionById(conf.electionID);
            return {
                ...conf,
                electionName: election?.name || 'Unknown Election'
            };
        });

        return reply.view('voting/confirmations.ejs', {
            title: 'My Voting Record',
            confirmations: enrichedConfirmations
        });
    }

    /**
     * Show printable receipt for a confirmation
     */
    async showReceipt(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        let voterID = request.session.voterID;
        let voterName = request.session.voterName;
        const guestVoterID = request.session.get('guestVoterID');
        const isGuest = !voterID && !!guestVoterID;
        
        if (!voterID && guestVoterID) {
            voterID = guestVoterID;
            const guestVoter = this.voterService.getVoterById(guestVoterID);
            voterName = guestVoter?.name || 'Guest Voter';
        }
        
        if (!voterID) {
            return reply.redirect('/login');
        }

        const { confirmationID } = request.params as { confirmationID: string };

        // Find the confirmation
        const confirmations = this.votingService.getVoterConfirmations(voterID);
        const confirmation = confirmations.find(c => c.confirmationID === confirmationID);

        if (!confirmation) {
            return reply.status(404).view('error.ejs', {
                title: 'Not Found',
                error: 'Confirmation not found'
            });
        }

        const election = this.electionService.getElectionById(confirmation.electionID);
        if (!election) {
            return reply.status(404).view('error.ejs', {
                title: 'Not Found',
                error: 'Election not found'
            });
        }

        return reply.view('voting/receipt.ejs', {
            voterID,
            voterName,
            election,
            confirmation,
            isGuest
        });
    }
}
