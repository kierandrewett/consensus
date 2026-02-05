import { FastifyRequest, FastifyReply } from 'fastify';
import { VoterService } from '../../services/VoterService';

export class AdminVoterController {
    constructor(private voterService: VoterService) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show voters management page
     */
    async showVoters(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return this.redirectToLogin(request, reply);
        }

        const voters = this.voterService.getAllVoters();

        return reply.view('admin/voters.ejs', {
            title: 'Manage Voters',
            voters
        });
    }

    /**
     * Show single voter details
     */
    async showVoter(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return this.redirectToLogin(request, reply);
        }

        const voter = this.voterService.getVoterById(request.params.id);
        if (!voter) {
            return reply.status(404).send('Voter not found');
        }

        return reply.view('admin/voter-detail.ejs', {
            title: `Voter: ${voter.name}`,
            voter
        });
    }

    /**
     * Approve voter
     */
    async approveVoter(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            this.voterService.approveVoter(request.params.id);
            return reply.send({ success: true });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Reject voter
     */
    async rejectVoter(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            this.voterService.rejectVoter(request.params.id);
            return reply.send({ success: true });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
