import { FastifyInstance } from 'fastify';
import { AdminAuthController, AdminDashboardController } from '../../controllers/admin';

export interface AdminControllers {
    auth: AdminAuthController;
    dashboard: AdminDashboardController;
}

export async function adminRoutes(
    fastify: FastifyInstance,
    controllers: AdminControllers
): Promise<void> {
    const { auth, dashboard } = controllers;

    // Auth routes
    fastify.get('/admin', async (_request, reply) => {
        return reply.redirect('/admin/login');
    });

    fastify.get('/admin/login', async (request, reply) => {
        return auth.showLogin(request, reply);
    });

    fastify.post('/admin/login', async (request, reply) => {
        return auth.login(request, reply);
    });

    fastify.get('/admin/logout', async (request, reply) => {
        return auth.logout(request, reply);
    });

    // Dashboard
    fastify.get('/admin/dashboard', async (request, reply) => {
        return dashboard.showDashboard(request, reply);
    });
}
