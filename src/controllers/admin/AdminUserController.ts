import { FastifyRequest, FastifyReply } from 'fastify';
import { AdminRepository } from '../../repositories/AdminRepository';
import { generatePassword } from '../../utils/password';
import { hashPassword } from '../../utils/password';

export interface CreateAdminRequest {
    username: string;
}

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

    /**
     * Create new admin
     */
    async createAdmin(
        request: FastifyRequest<{ Body: CreateAdminRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get('isAdmin')) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }

        const { username } = request.body;
        const tempPassword = generatePassword();
        const hashedPassword = await hashPassword(tempPassword);

        try {
            this.adminRepo.create({
                username,
                passwordHash: hashedPassword,
                mustChangePassword: true
            });

            return reply.view('admin/user-created.ejs', {
                username,
                temporaryPassword: tempPassword
            });
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
