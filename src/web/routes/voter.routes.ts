import { FastifyInstance } from "fastify";
import { VoterController } from "../../controllers/VoterController";

export async function voterRoutes(fastify: FastifyInstance, controller: VoterController): Promise<void> {
    // Registration
    fastify.get("/register", async (request, reply) => {
        return controller.showRegistrationForm(request, reply);
    });

    fastify.post("/register", async (request, reply) => {
        return controller.register(request, reply);
    });

    fastify.get("/registration-success", async (request, reply) => {
        return controller.showRegistrationSuccess(request, reply);
    });

    // Login
    fastify.get("/login", async (request, reply) => {
        return controller.showLoginForm(request, reply);
    });

    fastify.post("/login", async (request, reply) => {
        return controller.login(request, reply);
    });

    // Dashboard
    fastify.get("/dashboard", async (request, reply) => {
        return controller.showDashboard(request, reply);
    });

    // Profile
    fastify.get("/profile", async (request, reply) => {
        return controller.showProfile(request, reply);
    });

    fastify.post("/profile", async (request, reply) => {
        return controller.updateProfile(request, reply);
    });

    fastify.post("/delete-account", async (request, reply) => {
        return controller.deleteAccount(request, reply);
    });

    // Logout
    fastify.get("/logout", async (request, reply) => {
        return controller.logout(request, reply);
    });
}
