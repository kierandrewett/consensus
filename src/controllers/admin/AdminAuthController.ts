import { FastifyRequest, FastifyReply } from "fastify";
import { AdminRepository } from "../../repositories/AdminRepository";
import { PasswordUtil } from "../../utils/password";

export interface AdminLoginRequest {
    username: string;
    password: string;
}

export class AdminAuthController {
    constructor(private adminRepository: AdminRepository) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show admin login page
     */
    async showLogin(request: FastifyRequest<{ Querystring: { to?: string } }>, reply: FastifyReply): Promise<void> {
        const adminID = request.session.get("adminID");
        if (adminID) {
            return reply.redirect("/admin/dashboard");
        }

        const error = request.session.get("adminLoginError") || null;
        request.session.set("adminLoginError", undefined);
        const redirectTo = request.query.to || "";

        return reply.view("admin/login.ejs", {
            title: "Admin Login",
            error,
            redirectTo,
        });
    }

    /**
     * Handle admin login
     */
    async login(
        request: FastifyRequest<{ Body: AdminLoginRequest & { to?: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        const { username, password, to } = request.body;

        const admin = this.adminRepository.findByUsername(username);

        if (!admin) {
            const toParam = to ? `?to=${encodeURIComponent(to)}` : "";
            request.session.set("adminLoginError", "Invalid username or password");
            return reply.redirect(`/admin/login${toParam}`);
        }

        const isValidPassword = await PasswordUtil.verify(password, admin.passwordHash);

        if (!isValidPassword) {
            const toParam = to ? `?to=${encodeURIComponent(to)}` : "";
            request.session.set("adminLoginError", "Invalid username or password");
            return reply.redirect(`/admin/login${toParam}`);
        }

        // Set session - clear voter session first
        request.session.set("voterID", undefined);
        request.session.set("adminID", admin.adminID);
        request.session.set("adminUsername", admin.username);
        request.session.set("isAdmin", true);

        if (admin.mustChangePassword) {
            request.session.set("mustChangePassword", true);
            return reply.redirect("/admin/change-password");
        }

        const redirectUrl = to && to.startsWith("/admin") ? to : "/admin/dashboard";
        return reply.redirect(redirectUrl);
    }

    /**
     * Show change password page
     */
    async showChangePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const error = request.session.get("adminLoginError") || null;
        request.session.set("adminLoginError", undefined);
        const mustChange = request.session.get("mustChangePassword") || false;

        return reply.view("admin/change-password.ejs", {
            title: "Change Password",
            error,
            mustChange,
        });
    }

    /**
     * Handle password change
     */
    async changePassword(
        request: FastifyRequest<{ Body: { password: string; confirmPassword: string } }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const { password, confirmPassword } = request.body;
        const adminID = request.session.get("adminID");

        if (!adminID) {
            return reply.redirect("/admin/login");
        }

        if (password !== confirmPassword) {
            request.session.set("adminLoginError", "Passwords do not match");
            return reply.redirect("/admin/change-password");
        }

        if (!password || password.length < 6) {
            request.session.set("adminLoginError", "Password must be at least 6 characters");
            return reply.redirect("/admin/change-password");
        }

        const passwordHash = await PasswordUtil.hash(password);
        this.adminRepository.updatePassword(adminID, passwordHash);

        request.session.set("mustChangePassword", undefined);

        return reply.redirect("/admin/dashboard");
    }

    /**
     * Handle admin logout
     */
    async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        request.session.destroy();
        return reply.redirect("/");
    }
}
