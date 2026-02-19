import { FastifyInstance } from "fastify";
import { ElectionController } from "../../controllers/ElectionController";

export async function electionRoutes(fastify: FastifyInstance, controller: ElectionController): Promise<void> {
    // List active elections
    fastify.get("/elections", async (request, reply) => {
        return controller.listActive(request, reply);
    });

    // View election details
    fastify.get("/elections/:electionID", async (request, reply) => {
        return controller.viewElection(request, reply);
    });

    // View election results
    fastify.get("/elections/:electionID/results", async (request, reply) => {
        return controller.viewResults(request, reply);
    });
}
