import Database from "better-sqlite3";
import { Admin } from "../domain/entities/Admin";
import { DatabaseConnection } from "../db/connection";

export class AdminRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    /**
     * Find admin by username
     */
    findByUsername(username: string): Admin | null {
        const stmt = this.db.prepare(`
            SELECT admin_id, username, password_hash, name, created_at, must_change_password
            FROM admins
            WHERE username = ?
        `);

        const row = stmt.get(username) as any;

        if (!row) {
            return null;
        }

        return new Admin(
            row.admin_id,
            row.username,
            row.password_hash,
            row.name,
            new Date(row.created_at),
            Boolean(row.must_change_password)
        );
    }

    /**
     * Find admin by ID
     */
    findById(adminID: string): Admin | null {
        const stmt = this.db.prepare(`
            SELECT admin_id, username, password_hash, name, created_at, must_change_password
            FROM admins
            WHERE admin_id = ?
        `);

        const row = stmt.get(adminID) as any;

        if (!row) {
            return null;
        }

        return new Admin(
            row.admin_id,
            row.username,
            row.password_hash,
            row.name,
            new Date(row.created_at),
            Boolean(row.must_change_password)
        );
    }

    /**
     * Find all admins
     */
    findAll(): Admin[] {
        const stmt = this.db.prepare(`
            SELECT admin_id, username, password_hash, name, created_at, must_change_password
            FROM admins
        `);

        const rows = stmt.all() as any[];

        return rows.map(
            (row) =>
                new Admin(
                    row.admin_id,
                    row.username,
                    row.password_hash,
                    row.name,
                    new Date(row.created_at),
                    Boolean(row.must_change_password)
                )
        );
    }

    /**
     * Save admin to database
     */
    save(admin: Admin): void {
        const stmt = this.db.prepare(`
            INSERT INTO admins (admin_id, username, password_hash, name, created_at, must_change_password)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(admin_id) DO UPDATE SET
                username = excluded.username,
                password_hash = excluded.password_hash,
                name = excluded.name,
                must_change_password = excluded.must_change_password
        `);

        stmt.run(
            admin.adminID,
            admin.username,
            admin.passwordHash,
            admin.name,
            admin.createdAt.toISOString(),
            admin.mustChangePassword ? 1 : 0
        );
    }

    /**
     * Update admin password and clear mustChangePassword flag
     */
    updatePassword(adminID: string, passwordHash: string): void {
        const stmt = this.db.prepare(`
            UPDATE admins 
            SET password_hash = ?, must_change_password = 0
            WHERE admin_id = ?
        `);
        stmt.run(passwordHash, adminID);
    }

    /**
     * Delete admin by ID
     */
    delete(adminID: string): void {
        const stmt = this.db.prepare("DELETE FROM admins WHERE admin_id = ?");
        stmt.run(adminID);
    }
}
