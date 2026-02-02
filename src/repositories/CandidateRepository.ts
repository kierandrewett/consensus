import Database from 'better-sqlite3';
import { Candidate } from '../domain/entities/Candidate';
import { ICandidateRepository } from './interfaces/ICandidateRepository';
import { DatabaseConnection } from '../db/connection';

export class CandidateRepository implements ICandidateRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(candidate: Candidate): void {
        const stmt = this.db.prepare(`
            INSERT INTO candidates (candidate_id, election_id, name, party, biography)
            VALUES (?, ?, ?, ?, ?)
        `);

        stmt.run(
            candidate.candidateID,
            candidate.electionID,
            candidate.name,
            candidate.party,
            candidate.biography
        );
    }

    findById(candidateID: string): Candidate | null {
        const stmt = this.db.prepare(`
            SELECT * FROM candidates WHERE candidate_id = ?
        `);

        const row = stmt.get(candidateID) as any;
        return row ? this.mapRowToCandidate(row) : null;
    }

    findByElectionId(electionID: string): Candidate[] {
        const stmt = this.db.prepare(`
            SELECT * FROM candidates WHERE election_id = ? ORDER BY name
        `);

        const rows = stmt.all(electionID) as any[];
        return rows.map(row => this.mapRowToCandidate(row));
    }

    update(candidate: Candidate): void {
        const stmt = this.db.prepare(`
            UPDATE candidates
            SET name = ?, party = ?, biography = ?
            WHERE candidate_id = ?
        `);

        stmt.run(
            candidate.name,
            candidate.party,
            candidate.biography,
            candidate.candidateID
        );
    }

    delete(candidateID: string): void {
        const stmt = this.db.prepare(`
            DELETE FROM candidates WHERE candidate_id = ?
        `);

        stmt.run(candidateID);
    }

    findAll(): Candidate[] {
        const stmt = this.db.prepare(`
            SELECT * FROM candidates ORDER BY name
        `);

        const rows = stmt.all() as any[];
        return rows.map(row => this.mapRowToCandidate(row));
    }

    private mapRowToCandidate(row: any): Candidate {
        return new Candidate(
            row.candidate_id,
            row.election_id,
            row.name,
            row.party,
            row.biography
        );
    }
}
