import { FastifyRequest, FastifyReply } from 'fastify';
import { ElectionService, ElectionCreationDTO } from '../../services/ElectionService';
import { VotingService } from '../../services/VotingService';
import { ElectionType } from '../../domain/enums';

export interface ElectionCreationRequest {
    name: string;
    electionType: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface CandidateCreationRequest {
    name: string;
    party: string;
    biography: string;
}

export class AdminElectionController {
    constructor(
        private electionService: ElectionService,
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
     * Show elections management page
     */
    async showElections(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return this.redirectToLogin(request, reply);
        }

        const elections = this.electionService.getAllElections();

        return reply.view('admin/elections.ejs', {
            title: 'Manage Elections',
            elections
        });
    }

    /**
     * Show single election details
     */
    async showElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return this.redirectToLogin(request, reply);
        }

        const election = this.electionService.getElectionById(request.params.id);
        if (!election) {
            return reply.status(404).send('Election not found');
        }

        const voteCount = this.votingService.getVoteCount(election.electionID);
        const candidates = this.electionService.getCandidates(election.electionID);

        return reply.view('admin/election-detail.ejs', {
            title: `Election: ${election.name}`,
            election,
            candidates,
            voteCount
        });
    }

    /**
     * Create a new election
     */
    async createElection(
        request: FastifyRequest<{ Body: ElectionCreationRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { name, electionType, startDate, endDate, description } = request.body;

        try {
            const dto: ElectionCreationDTO = {
                name,
                electionType: electionType as ElectionType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                description
            };

            const election = this.electionService.createElection(dto);

            return reply.redirect(`/admin/elections/${election.electionID}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Add candidate to election
     */
    async addCandidate(
        request: FastifyRequest<{
            Params: { id: string };
            Body: CandidateCreationRequest;
        }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const electionID = request.params.id;
        const { name, party, biography } = request.body;

        try {
            this.electionService.addCandidate(electionID, { name, party, biography });
            return reply.redirect(`/admin/elections/${electionID}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Activate election
     */
    async activateElection(
        request: FastifyRequest<{ Params: { id: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            this.electionService.activateElection(request.params.id);
            return reply.redirect(`/admin/elections/${request.params.id}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Close election early
     */
    async closeElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            this.electionService.closeElection(request.params.id);
            return reply.redirect(`/admin/elections/${request.params.id}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Delete election
     */
    async deleteElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        try {
            this.electionService.deleteElection(request.params.id);
            return reply.redirect('/admin/elections');
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
