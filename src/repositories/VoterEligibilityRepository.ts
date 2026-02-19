import Database from "better-sqlite3";
import { VoterEligibility } from "../domain/entities/VoterEligibility";
import { IVoterEligibilityRepository } from "./interfaces/IVoterEligibilityRepository";
import { DatabaseConnection } from "../db/connection";

export class VoterEligibilityRepository implements IVoterEligibilityRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(eligibility: VoterEligibility): void {
        const stmt = this.db.prepare(`
            INSERT INTO voter_eligibility (voter_id, election_id, has_voted, voted_at)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(
            eligibility.voterID,
            eligibility.electionID,
            eligibility.hasVoted ? 1 : 0,
            eligibility.votedAt ? eligibility.votedAt.toISOString() : null
        );
    }

    findByVoterAndElection(voterID: string, electionID: string): VoterEligibility | null {
        const stmt = this.db.prepare(`
            SELECT * FROM voter_eligibility
            WHERE voter_id = ? AND election_id = ?
        `);

        const row = stmt.get(voterID, electionID) as any;
        return row ? this.mapRowToEligibility(row) : null;
    }

    findByVoterId(voterID: string): VoterEligibility[] {
        const stmt = this.db.prepare(`
            SELECT * FROM voter_eligibility WHERE voter_id = ?
        `);

        const rows = stmt.all(voterID) as any[];
        return rows.map((row) => this.mapRowToEligibility(row));
    }

    findByElectionId(electionID: string): VoterEligibility[] {
        const stmt = this.db.prepare(`
            SELECT * FROM voter_eligibility WHERE election_id = ?
        `);

        const rows = stmt.all(electionID) as any[];
        return rows.map((row) => this.mapRowToEligibility(row));
    }

    hasVoted(voterID: string, electionID: string): boolean {
        const stmt = this.db.prepare(`
            SELECT has_voted FROM voter_eligibility
            WHERE voter_id = ? AND election_id = ?
        `);

        const row = stmt.get(voterID, electionID) as any;
        return row ? Boolean(row.has_voted) : false;
    }

    markVoted(voterID: string, electionID: string): void {
        const now = new Date().toISOString();

        // Try to update existing record
        const updateStmt = this.db.prepare(`
            UPDATE voter_eligibility
            SET has_voted = 1, voted_at = ?
            WHERE voter_id = ? AND election_id = ?
        `);

        const result = updateStmt.run(now, voterID, electionID);

        // If no record exists, insert one
        if (result.changes === 0) {
            const insertStmt = this.db.prepare(`
                INSERT INTO voter_eligibility (voter_id, election_id, has_voted, voted_at)
                VALUES (?, ?, 1, ?)
            `);

            insertStmt.run(voterID, electionID, now);
        }
    }

    private mapRowToEligibility(row: any): VoterEligibility {
        return new VoterEligibility(
            row.voter_id,
            row.election_id,
            Boolean(row.has_voted),
            row.voted_at ? new Date(row.voted_at) : undefined
        );
    }
}
