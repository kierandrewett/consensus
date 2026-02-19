import Database from "better-sqlite3";
import { Voter } from "../domain/entities/Voter";
import { RegistrationStatus } from "../domain/enums";
import { IVoterRepository } from "./interfaces/IVoterRepository";
import { DatabaseConnection } from "../db/connection";

export class VoterRepository implements IVoterRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(voter: Voter): void {
        const stmt = this.db.prepare(`
            INSERT INTO voters (voter_id, name, email, password_hash, registration_status, registration_date)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            voter.voterID,
            voter.name,
            voter.email,
            voter.passwordHash,
            voter.registrationStatus,
            voter.registrationDate.toISOString()
        );
    }

    findById(voterID: string): Voter | null {
        const stmt = this.db.prepare(`
            SELECT * FROM voters WHERE voter_id = ?
        `);

        const row = stmt.get(voterID) as any;
        return row ? this.mapRowToVoter(row) : null;
    }

    findByEmail(email: string): Voter | null {
        const stmt = this.db.prepare(`
            SELECT * FROM voters WHERE email = ?
        `);

        const row = stmt.get(email) as any;
        return row ? this.mapRowToVoter(row) : null;
    }

    update(voter: Voter): void {
        const stmt = this.db.prepare(`
            UPDATE voters
            SET name = ?, email = ?, password_hash = ?, registration_status = ?
            WHERE voter_id = ?
        `);

        stmt.run(voter.name, voter.email, voter.passwordHash, voter.registrationStatus, voter.voterID);
    }

    delete(voterID: string): void {
        const stmt = this.db.prepare(`
            DELETE FROM voters WHERE voter_id = ?
        `);

        stmt.run(voterID);
    }

    findAll(): Voter[] {
        const stmt = this.db.prepare(`
            SELECT * FROM voters
        `);

        const rows = stmt.all() as any[];
        return rows.map((row) => this.mapRowToVoter(row));
    }

    private mapRowToVoter(row: any): Voter {
        return new Voter(
            row.voter_id,
            row.name,
            row.email,
            row.password_hash,
            row.registration_status as RegistrationStatus,
            new Date(row.registration_date)
        );
    }
}
