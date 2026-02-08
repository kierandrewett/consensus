import { FastifyRequest, FastifyReply } from 'fastify';
import { SettingsRepository } from '../../repositories/SettingsRepository';

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
}
