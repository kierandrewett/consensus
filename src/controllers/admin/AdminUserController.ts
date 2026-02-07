import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminRepository } from '../../repositories/AdminRepository';

export class AdminUserController {
    constructor(private adminRepo: AdminRepository) {}

    /**
     * List all admins
     */
    async listAdmins(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.redirect('/admin/login');
        }

        const admins = this.adminRepo.findAll();
        return reply.view('admin/users.ejs', { admins });
    }
}
