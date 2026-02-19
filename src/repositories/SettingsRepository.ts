import Database from "better-sqlite3";
import { DatabaseConnection } from "../db/connection";

export interface SystemSettings {
    bannerMessage: string;
    bannerEnabled: boolean;
    bannerType: "info" | "warning" | "error";
    signupEnabled: boolean;
    loginEnabled: boolean;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    guestVotingEnabled: boolean;
    autoApprovalEnabled: boolean;
    turnstileEnabled: boolean;
    turnstileSiteKey: string;
    turnstileSecretKey: string;
}

export class SettingsRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    /**
     * Get a single setting value
     */
    get(key: string): string | null {
        const stmt = this.db.prepare("SELECT value FROM settings WHERE key = ?");
        const row = stmt.get(key) as { value: string } | undefined;
        return row?.value ?? null;
    }

    /**
     * Set a single setting value
     */
    set(key: string, value: string): void {
        const stmt = this.db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);
        stmt.run(key, value);
    }

    /**
     * Get all settings as an object
     */
    getAll(): SystemSettings {
        const stmt = this.db.prepare("SELECT key, value FROM settings");
        const rows = stmt.all() as { key: string; value: string }[];

        const settings: Record<string, string> = {};
        rows.forEach((row) => {
            settings[row.key] = row.value;
        });

        return {
            bannerMessage: settings["banner_message"] || "",
            bannerEnabled: settings["banner_enabled"] === "true",
            bannerType: (settings["banner_type"] as "info" | "warning" | "error") || "info",
            signupEnabled: settings["signup_enabled"] !== "false",
            loginEnabled: settings["login_enabled"] !== "false",
            maintenanceMode: settings["maintenance_mode"] === "true",
            maintenanceMessage: settings["maintenance_message"] || "The system is currently under maintenance.",
            guestVotingEnabled: settings["guest_voting_enabled"] === "true",
            autoApprovalEnabled: settings["auto_approval_enabled"] === "true",
            turnstileEnabled: settings["turnstile_enabled"] === "true",
            turnstileSiteKey: settings["turnstile_site_key"] || "",
            turnstileSecretKey: settings["turnstile_secret_key"] || "",
        };
    }

    /**
     * Update multiple settings at once
     */
    updateAll(settings: Partial<SystemSettings>): void {
        const mapping: Record<keyof SystemSettings, string> = {
            bannerMessage: "banner_message",
            bannerEnabled: "banner_enabled",
            bannerType: "banner_type",
            signupEnabled: "signup_enabled",
            loginEnabled: "login_enabled",
            maintenanceMode: "maintenance_mode",
            maintenanceMessage: "maintenance_message",
            guestVotingEnabled: "guest_voting_enabled",
            autoApprovalEnabled: "auto_approval_enabled",
            turnstileEnabled: "turnstile_enabled",
            turnstileSiteKey: "turnstile_site_key",
            turnstileSecretKey: "turnstile_secret_key",
        };

        for (const [key, value] of Object.entries(settings)) {
            const dbKey = mapping[key as keyof SystemSettings];
            if (dbKey && value !== undefined) {
                const strValue = typeof value === "boolean" ? value.toString() : String(value);
                this.set(dbKey, strValue);
            }
        }
    }
}
