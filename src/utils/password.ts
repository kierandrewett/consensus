import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export class PasswordUtil {
    /**
     * Hash a plaintext password
     */
    static async hash(plainPassword: string): Promise<string> {
        return await bcrypt.hash(plainPassword, SALT_ROUNDS);
    }

    /**
     * Verify a password against a hash
     */
    static async verify(plainPassword: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hash);
    }
}
