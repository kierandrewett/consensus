/**
 * Cloudflare Turnstile verification utility
 */

interface TurnstileVerifyResponse {
    success: boolean;
    "error-codes"?: string[];
    challenge_ts?: string;
    hostname?: string;
}

export class TurnstileUtil {
    private static readonly VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

    /**
     * Verify a Turnstile token
     * @param token The cf-turnstile-response token from the form
     * @param secretKey The Turnstile secret key
     * @param remoteIP Optional: The user's IP address for additional verification
     * @returns true if verification succeeded, false otherwise
     */
    static async verify(token: string, secretKey: string, remoteIP?: string): Promise<boolean> {
        if (!token || !secretKey) {
            return false;
        }

        try {
            const formData = new URLSearchParams();
            formData.append("secret", secretKey);
            formData.append("response", token);
            if (remoteIP) {
                formData.append("remoteip", remoteIP);
            }

            const response = await fetch(TurnstileUtil.VERIFY_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                console.error("Turnstile verification request failed:", response.status);
                return false;
            }

            const result = (await response.json()) as TurnstileVerifyResponse;

            if (!result.success && result["error-codes"]) {
                console.warn("Turnstile verification failed:", result["error-codes"]);
            }

            return result.success;
        } catch (error) {
            console.error("Turnstile verification error:", error);
            return false;
        }
    }
}
