import Database from 'better-sqlite3';
import { Ballot } from '../domain/entities/Ballot';
import { IBallotRepository } from './interfaces/IBallotRepository';
import { DatabaseConnection } from '../db/connection';

export class BallotRepository implements IBallotRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(ballot: Ballot): void {
        const stmt = this.db.prepare(`
            INSERT INTO ballots (ballot_id, election_id, preferences, cast_at)
            VALUES (?, ?, ?, ?)
        `);

        stmt.run(
            ballot.ballotID,
            ballot.electionID,
            JSON.stringify(ballot.preferences),
            ballot.castAt.toISOString()
        );
    }

    findById(ballotID: string): Ballot | null {
        const stmt = this.db.prepare(`
            SELECT * FROM ballots WHERE ballot_id = ?
        `);

        const row = stmt.get(ballotID) as any;
        return row ? this.mapRowToBallot(row) : null;
    }

    findByElectionId(electionID: string): Ballot[] {
        const stmt = this.db.prepare(`
            SELECT * FROM ballots WHERE election_id = ?
        `);

        const rows = stmt.all(electionID) as any[];
        return rows.map(row => this.mapRowToBallot(row));
    }

    countByElectionId(electionID: string): number {
        const stmt = this.db.prepare(`
            SELECT COUNT(*) as count FROM ballots WHERE election_id = ?
        `);

        const row = stmt.get(electionID) as any;
        return row.count;
    }

    countByCandidate(electionID: string, candidateID: string): number {
        const stmt = this.db.prepare(`
            SELECT COUNT(*) as count
            FROM ballots
            WHERE election_id = ? AND json_extract(preferences, '$[0]') = ?
        `);

        const row = stmt.get(electionID, candidateID) as any;
        return row.count;
    }

    private mapRowToBallot(row: any): Ballot {
        return new Ballot(
            row.ballot_id,
            row.election_id,
            JSON.parse(row.preferences),
            new Date(row.cast_at)
        );
    }
}
