import { FastifyInstance } from 'fastify';
import { VoterController } from '../../controllers/VoterController';

export async function voterRoutes(fastify: FastifyInstance, controller: VoterController): Promise<void> {
    // Registration
    fastify.get('/register', async (request, reply) => {
        return controller.showRegistrationForm(request, reply);
    });

    fastify.post('/register', async (request, reply) => {
        return controller.register(request, reply);
    });
}
