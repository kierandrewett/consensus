import { FastifyRequest, FastifyReply } from 'fastify';
import { ElectionService } from '../../services/ElectionService';
import { VoterService } from '../../services/VoterService';
import { VotingService } from '../../services/VotingService';

export class AdminDashboardController {
    constructor(
        private electionService: ElectionService,
        private voterService: VoterService,
        private votingService: VotingService
    ) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show admin dashboard
     */
    async showDashboard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return this.redirectToLogin(request, reply);
        }

        const elections = this.electionService.getAllElections();
        const activeElections = elections.filter(e => e.status === 'ACTIVE');
        const voters = this.voterService.getAllVoters();

        let totalVotes = 0;
        elections.forEach(election => {
            totalVotes += this.votingService.getVoteCount(election.electionID);
        });

        const stats = {
            totalElections: elections.length,
            activeElections: activeElections.length,
            totalVoters: voters.length,
            totalVotes: totalVotes
        };

        return reply.view('admin/dashboard.ejs', {
            title: 'Admin Dashboard',
            stats
        });
    }
}
