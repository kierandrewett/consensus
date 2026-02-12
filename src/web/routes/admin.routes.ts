import { FastifyInstance } from 'fastify';
import {
    AdminAuthController,
    AdminDashboardController,
    AdminElectionController,
    AdminVoterController,
    AdminUserController,
    AdminSettingsController
} from '../../controllers/admin';

export interface AdminControllers {
    auth: AdminAuthController;
    dashboard: AdminDashboardController;
    election: AdminElectionController;
    voter: AdminVoterController;
    user: AdminUserController;
    settings: AdminSettingsController;
}

export async function adminRoutes(
    fastify: FastifyInstance,
    controllers: AdminControllers
): Promise<void> {
    const { auth, dashboard, election, voter, user, settings } = controllers;

    // ==================== AUTH ROUTES ====================
    fastify.get('/admin', async (_request, reply) => {
        return reply.redirect('/admin/login');
    });

    fastify.get('/admin/login', async (request, reply) => {
        return auth.showLogin(request, reply);
    });

    fastify.post('/admin/login', async (request, reply) => {
        return auth.login(request, reply);
    });

    fastify.get('/admin/change-password', async (request, reply) => {
        return auth.showChangePassword(request, reply);
    });

    fastify.post('/admin/change-password', async (request, reply) => {
        return auth.changePassword(request, reply);
    });

    fastify.get('/admin/logout', async (request, reply) => {
        return auth.logout(request, reply);
    });

    // ==================== DASHBOARD ROUTES ====================
    fastify.get('/admin/dashboard', async (request, reply) => {
        return dashboard.showDashboard(request, reply);
    });

    // ==================== ELECTION ROUTES ====================
    fastify.get('/admin/elections', async (request, reply) => {
        return election.showElections(request, reply);
    });

    fastify.post('/admin/elections', async (request, reply) => {
        return election.createElection(request, reply);
    });

    fastify.get('/admin/results', async (request, reply) => {
        return election.showResults(request, reply);
    });

    fastify.get('/admin/elections/:id', async (request, reply) => {
        return election.showElection(request, reply);
    });

    fastify.post('/admin/elections/:id/close', async (request, reply) => {
        return election.closeElection(request, reply);
    });

    fastify.post('/admin/elections/:id/activate', async (request, reply) => {
        return election.activateElection(request, reply);
    });

    fastify.post('/admin/elections/:id/candidates', async (request, reply) => {
        return election.addCandidate(request, reply);
    });

    fastify.post('/admin/elections/:electionId/candidates/:candidateId/remove', async (request, reply) => {
        return election.removeCandidate(request, reply);
    });

    fastify.post('/admin/elections/:id/resolve-tie', async (request, reply) => {
        return election.resolveTie(request, reply);
    });

    fastify.post('/admin/elections/:id/delete', async (request, reply) => {
        return election.deleteElection(request, reply);
    });

    fastify.delete('/admin/elections/:id', async (request, reply) => {
        return election.deleteElection(request, reply);
    });
}
