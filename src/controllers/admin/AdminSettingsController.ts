import { FastifyRequest, FastifyReply } from "fastify";
import { SettingsRepository } from "../../repositories/SettingsRepository";

export class AdminSettingsController {
    constructor(private settingsRepository: SettingsRepository) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show management settings page
     */
    async showManagement(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const settings = this.settingsRepository.getAll();
        const successMessage = request.session.get("managementSuccess");
        request.session.set("managementSuccess", undefined);

        return reply.view("admin/management.ejs", {
            title: "System Management",
            settings,
            success: successMessage,
        });
    }

    /**
     * Update management settings
     */
    async updateManagement(
        request: FastifyRequest<{
            Body: {
                bannerEnabled?: string;
                bannerMessage?: string;
                bannerType?: string;
                signupEnabled?: string;
                loginEnabled?: string;
                maintenanceMode?: string;
                maintenanceMessage?: string;
                guestVotingEnabled?: string;
                autoApprovalEnabled?: string;
                turnstileEnabled?: string;
                turnstileSiteKey?: string;
                turnstileSecretKey?: string;
            };
        }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const body = request.body;

        // If guest voting is enabled, auto-approval must be enabled
        const guestVotingEnabled = body.guestVotingEnabled === "on";
        const autoApprovalEnabled = guestVotingEnabled || body.autoApprovalEnabled === "on";

        this.settingsRepository.updateAll({
            bannerEnabled: body.bannerEnabled === "on",
            bannerMessage: body.bannerMessage || "",
            bannerType: (body.bannerType as "info" | "warning" | "error") || "info",
            signupEnabled: body.signupEnabled === "on",
            loginEnabled: body.loginEnabled === "on",
            maintenanceMode: body.maintenanceMode === "on",
            maintenanceMessage: body.maintenanceMessage || "",
            guestVotingEnabled,
            autoApprovalEnabled,
            turnstileEnabled: body.turnstileEnabled === "on",
            turnstileSiteKey: body.turnstileSiteKey || "",
            turnstileSecretKey: body.turnstileSecretKey || "",
        });

        request.session.set("managementSuccess", "Settings updated successfully");
        return reply.redirect("/admin/management");
    }
}
