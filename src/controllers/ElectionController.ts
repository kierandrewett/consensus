import { FastifyRequest, FastifyReply } from 'fastify';
import { ElectionService } from '../services/ElectionService';
import { VotingService } from '../services/VotingService';
import { VoterService } from '../services/VoterService';
import { TieResolutionRepository } from '../repositories/TieResolutionRepository';
import { SettingsRepository } from '../repositories/SettingsRepository';
import { createHash } from 'crypto';

export class ElectionController {
    constructor(
        private electionService: ElectionService,
        private votingService: VotingService,
        private tieResolutionRepository: TieResolutionRepository,
        private voterService?: VoterService,
        private settingsRepository?: SettingsRepository
    ) {}

    /**
     * Get guest voter ID from IP address
     */
    private getGuestVoterIDFromIP(request: FastifyRequest): string | null {
        const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
        const ipString = Array.isArray(ip) ? ip[0] : ip;
        const hashedIP = createHash('sha256').update(ipString).digest('hex').substring(0, 16);
        const guestEmail = `guest_${hashedIP}@guest.local`;
        
        const voter = this.voterService?.getVoterByEmail(guestEmail);
        return voter?.voterID || null;
    }

    /**
     * List all active elections
     */
    async listActive(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const elections = this.electionService.getActiveElections();
        const closedElections = this.electionService.getClosedElections();
        const guestVotingEnabled = this.settingsRepository?.getAll().guestVotingEnabled ?? false;
        let effectiveVoterID = request.session.voterID;
        let isGuest = false;
        
        // Only check for guest voter IDs if guest voting is enabled
        if (!effectiveVoterID && guestVotingEnabled) {
            const guestVoterID = request.session.guestVoterID;
            if (guestVoterID) {
                effectiveVoterID = guestVoterID;
                isGuest = true;
            } else {
                // Try to find guest voter by IP lookup
                const ipVoterID = this.getGuestVoterIDFromIP(request);
                if (ipVoterID) {
                    effectiveVoterID = ipVoterID;
                    isGuest = true;
                }
            }
        }

        // Build map of which elections the voter has already voted in
        const votedElections = new Set<string>();
        if (effectiveVoterID) {
            const vid = effectiveVoterID; // Capture for closure
            elections.forEach(election => {
                if (this.votingService.hasVoted(vid, election.electionID)) {
                    votedElections.add(election.electionID);
                }
            });
            // Also check closed elections
            closedElections.forEach(election => {
                if (this.votingService.hasVoted(vid, election.electionID)) {
                    votedElections.add(election.electionID);
                }
            });
        }

        return reply.view('elections/list.ejs', {
            title: 'Elections',
            elections,
            closedElections,
            votedElections: Array.from(votedElections),
            isAdmin: request.session.isAdmin || false,
            isGuest,
            guestVotingEnabled
        });
    }

    /**
     * View election details
     */
    async viewElection(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const { electionID } = request.params as any;

        const election = this.electionService.getElectionById(electionID);
        if (!election) {
            return reply.status(404).view('error.ejs', {
                title: 'Not Found',
                error: 'Election not found'
            });
        }

        const candidates = this.electionService.getCandidates(electionID);
        const voteCount = this.votingService.getVoteCount(electionID);

        // If election is closed, also include results and tie resolution for winner display
        let results = null;
        let tieResolution = null;
        let winner = null;

        if (election.status === 'CLOSED') {
            results = this.votingService.calculateResults(electionID);
            tieResolution = this.tieResolutionRepository.findByElectionId(electionID);
            
            // Determine winner
            if (tieResolution && tieResolution.winnerCandidateID) {
                // Winner from tie resolution
                winner = results.find((r: any) => r.candidateID === tieResolution!.winnerCandidateID);
            } else if (results.length > 0) {
                // Check for clear winner (isWinner flag and not tied)
                const clearWinner = results.find((r: any) => r.isWinner && !r.isTied);
                if (clearWinner) {
                    winner = clearWinner;
                }
            }
        }

        return reply.view('elections/details.ejs', {
            title: election.name,
            election,
            candidates,
            voteCount,
            results,
            tieResolution,
            winner
        });
    }

    /**
     * View election results (closed elections only)
     */
    async viewResults(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const { electionID } = request.params as any;

        try {
            const election = this.electionService.getElectionById(electionID);
            if (!election) {
                return reply.status(404).view('error.ejs', {
                    title: 'Not Found',
                    error: 'Election not found'
                });
            }

            const results = this.votingService.calculateResults(electionID);
            const totalVotes = this.votingService.getVoteCount(electionID);
            const tieResolution = this.tieResolutionRepository.findByElectionId(electionID);

            return reply.view('elections/results.ejs', {
                title: `Results: ${election.name}`,
                election,
                results,
                totalVotes,
                tieResolution
            });
        } catch (error: any) {
            return reply.view('error.ejs', {
                title: 'Error',
                error: error.message
            });
        }
    }
}
