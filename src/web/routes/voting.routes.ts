import { FastifyInstance } from 'fastify';
import { VotingController } from '../../controllers/VotingController';

export async function votingRoutes(fastify: FastifyInstance, controller: VotingController): Promise<void> {
    // Vote in election
    fastify.get('/vote/:electionID', async (request, reply) => {
        return controller.showVotingForm(request, reply);
    });

    fastify.post('/vote/:electionID', async (request, reply) => {
        return controller.castVote(request, reply);
    });

    // Show confirmation after vote (GET after POST redirect)
    fastify.get('/vote/:electionID/confirmed', async (request, reply) => {
        return controller.showConfirmation(request, reply);
    });

    // View confirmations
    fastify.get('/confirmations', async (request, reply) => {
        return controller.viewConfirmations(request, reply);
    });

    // Print receipt for a confirmation
    fastify.get('/receipt/:confirmationID', async (request, reply) => {
        return controller.showReceipt(request, reply);
    });
}
