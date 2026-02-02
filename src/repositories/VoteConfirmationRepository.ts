import Database from 'better-sqlite3';
import { VoteConfirmation } from '../domain/entities/VoteConfirmation';
import { DatabaseConnection } from '../db/connection';

export interface IVoteConfirmationRepository {
    save(confirmation: VoteConfirmation): void;
    findById(confirmationID: string): VoteConfirmation | null;
    findByVoterId(voterID: string): VoteConfirmation[];
}

export class VoteConfirmationRepository implements IVoteConfirmationRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(confirmation: VoteConfirmation): void {
        const stmt = this.db.prepare(`
            INSERT INTO vote_confirmations (confirmation_id, voter_id, election_id, confirmed_at)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(
            confirmation.confirmationID,
            confirmation.voterID,
            confirmation.electionID,
            confirmation.confirmedAt.toISOString()
        );
    }

    findById(confirmationID: string): VoteConfirmation | null {
        const stmt = this.db.prepare(`
            SELECT * FROM vote_confirmations WHERE confirmation_id = ?
        `);

        const row = stmt.get(confirmationID) as any;
        return row ? this.mapRowToConfirmation(row) : null;
    }

    findByVoterId(voterID: string): VoteConfirmation[] {
        const stmt = this.db.prepare(`
            SELECT * FROM vote_confirmations WHERE voter_id = ? ORDER BY confirmed_at DESC
        `);

        const rows = stmt.all(voterID) as any[];
        return rows.map(row => this.mapRowToConfirmation(row));
    }

    private mapRowToConfirmation(row: any): VoteConfirmation {
        return new VoteConfirmation(
            row.confirmation_id,
            row.voter_id,
            row.election_id,
            new Date(row.confirmed_at)
        );
    }
}
