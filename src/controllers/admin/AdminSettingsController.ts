import { FastifyRequest, FastifyReply } from 'fastify';
import { SettingsRepository } from '../../repositories/SettingsRepository';

export interface BannerSettingsRequest {
    bannerText: string;
    bannerEnabled: string;
}

export interface MaintenanceRequest {
    maintenanceMode: string;
}

export interface GuestVotingRequest {
    guestVotingEnabled: string;
}

export class AdminSettingsController {
    constructor(private settingsRepo: SettingsRepository) {}

    /**
     * Show settings page
     */
    async showSettings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.redirect('/admin/login');
        }

        const settings = this.settingsRepo.getAll();
        return reply.view('admin/settings.ejs', { settings });
    }

    /**
     * Update banner settings
     */
    async updateBanner(
        request: FastifyRequest<{ Body: BannerSettingsRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { bannerText, bannerEnabled } = request.body;
        
        this.settingsRepo.set('banner_text', bannerText);
        this.settingsRepo.set('banner_enabled', bannerEnabled === 'on' ? 'true' : 'false');

        return reply.redirect('/admin/settings');
    }

    /**
     * Update maintenance mode
     */
    async updateMaintenanceMode(
        request: FastifyRequest<{ Body: MaintenanceRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { maintenanceMode } = request.body;
        this.settingsRepo.set('maintenance_mode', maintenanceMode === 'on' ? 'true' : 'false');

        return reply.redirect('/admin/settings');
    }

    /**
     * Update guest voting settings
     */
    async updateGuestVoting(
        request: FastifyRequest<{ Body: GuestVotingRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { guestVotingEnabled } = request.body;
        this.settingsRepo.set('guest_voting_enabled', guestVotingEnabled === 'on' ? 'true' : 'false');

        return reply.redirect('/admin/settings');
    }
}
