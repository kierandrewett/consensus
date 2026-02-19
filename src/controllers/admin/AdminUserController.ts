import { FastifyRequest, FastifyReply } from "fastify";
import { AdminRepository } from "../../repositories/AdminRepository";
import { PasswordUtil } from "../../utils/password";
import { Admin } from "../../domain/entities/Admin";
import { v4 as uuidv4 } from "uuid";
import { randomInt } from "crypto";

export interface AdminCreationRequest {
    username: string;
    name: string;
}

export class AdminUserController {
    constructor(private adminRepository: AdminRepository) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show admin users management page
     */
    async showAdminUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        return this.renderAdminsPage(request, reply, {});
    }

    /**
     * Helper to render admins page with common data
     */
    private async renderAdminsPage(
        request: FastifyRequest,
        reply: FastifyReply,
        extras: Record<string, any>
    ): Promise<void> {
        const currentAdminID = request.session.get("adminID");
        const currentAdmin = this.adminRepository.findById(currentAdminID!);

        const adminCreatedUsername = request.session.get("adminCreatedUsername");
        const adminCreatedPassword = request.session.get("adminCreatedPassword");
        const adminError = request.session.get("adminError");

        request.session.set("adminCreatedUsername", undefined);
        request.session.set("adminCreatedPassword", undefined);
        request.session.set("adminError", undefined);

        const flashData: Record<string, any> = {};
        if (adminCreatedUsername && adminCreatedPassword) {
            flashData.success = true;
            flashData.newAdminUsername = adminCreatedUsername;
            flashData.newAdminPassword = adminCreatedPassword;
        }
        if (adminError) {
            flashData.error = adminError;
        }

        return reply.view("admin/admins.ejs", {
            title: "Manage Administrators",
            admins: this.adminRepository.findAll(),
            currentAdminID,
            currentAdminCreatedAt: currentAdmin?.createdAt,
            ...flashData,
            ...extras,
        });
    }

    /**
     * Create new admin user
     */
    async createAdmin(
        request: FastifyRequest<{ Body: { username: string; name: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const { username, name } = request.body;

        const existingAdmin = this.adminRepository.findByUsername(username);
        if (existingAdmin) {
            request.session.set("adminError", "Username already exists");
            return reply.redirect("/admin/admins");
        }

        if (!username || username.length < 3) {
            request.session.set("adminError", "Username must be at least 3 characters");
            return reply.redirect("/admin/admins");
        }

        const tempPassword = this.generateRandomPassword();
        const passwordHash = await PasswordUtil.hash(tempPassword);

        const admin = new Admin(
            uuidv4(),
            username.toLowerCase(),
            passwordHash,
            name || username,
            new Date(),
            true // mustChangePassword
        );

        this.adminRepository.save(admin);

        request.session.set("adminCreatedUsername", username.toLowerCase());
        request.session.set("adminCreatedPassword", tempPassword);
        return reply.redirect("/admin/admins");
    }

    /**
     * Generate a random password
     */
    private generateRandomPassword(): string {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(randomInt(0, chars.length));
        }
        return password;
    }

    /**
     * Delete admin user
     */
    async deleteAdmin(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const adminID = request.params.id;
        const currentAdminID = request.session.get("adminID");

        if (adminID === currentAdminID) {
            return this.renderAdminsPage(request, reply, {
                error: "You cannot delete your own account",
            });
        }

        const admin = this.adminRepository.findById(adminID);
        if (!admin) {
            return reply.redirect("/admin/admins");
        }

        const currentAdmin = this.adminRepository.findById(currentAdminID!);
        if (!currentAdmin) {
            return reply.redirect("/admin/admins");
        }

        if (admin.createdAt <= currentAdmin.createdAt) {
            return this.renderAdminsPage(request, reply, {
                error: "You cannot delete administrators who were created before your account",
            });
        }

        const allAdmins = this.adminRepository.findAll();
        if (allAdmins.length <= 1) {
            return this.renderAdminsPage(request, reply, {
                error: "Cannot delete the last administrator",
            });
        }

        this.adminRepository.delete(adminID);

        return reply.redirect("/admin/admins");
    }
}
