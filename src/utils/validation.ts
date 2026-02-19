import zxcvbn from "zxcvbn";

export interface PasswordStrengthResult {
    isStrong: boolean;
    score: number;
    feedback: string;
    suggestions: string[];
}

export class ValidationUtil {
    /**
     * Validate email format
     */
    static isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength using zxcvbn
     * Returns detailed feedback about password strength
     * Score: 0 (weakest) to 4 (strongest)
     * Requires score >= 3 for registration
     */
    static checkPasswordStrength(password: string, userInputs?: string[]): PasswordStrengthResult {
        const result = zxcvbn(password, userInputs);

        const isStrong = result.score >= 3;

        let feedback = "";
        if (result.feedback.warning) {
            feedback = result.feedback.warning;
        } else if (!isStrong) {
            feedback = "Password is too weak";
        }

        return {
            isStrong,
            score: result.score,
            feedback,
            suggestions: result.feedback.suggestions || [],
        };
    }

    /**
     * Validate password strength (simple boolean check)
     */
    static isStrongPassword(password: string): boolean {
        return this.checkPasswordStrength(password).isStrong;
    }

    /**
     * Sanitize user input (basic XSS prevention)
     */
    static sanitize(input: string): string {
        return input
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
    }

    /**
     * Validate UUID format
     */
    static isValidUUID(uuid: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(uuid);
    }
}
