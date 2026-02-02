import Database from 'better-sqlite3';
import { Election } from '../domain/entities/Election';
import { ElectionType, ElectionStatus } from '../domain/enums';
import { IElectionRepository } from './interfaces/IElectionRepository';
import { DatabaseConnection } from '../db/connection';

export class ElectionRepository implements IElectionRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(election: Election): void {
        const stmt = this.db.prepare(`
            INSERT INTO elections (election_id, name, election_type, status, start_date, end_date, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            election.electionID,
            election.name,
            election.electionType,
            election.status,
            election.startDate.toISOString(),
            election.endDate.toISOString(),
            election.description
        );
    }

    findById(electionID: string): Election | null {
        const stmt = this.db.prepare(`
            SELECT * FROM elections WHERE election_id = ?
        `);

        const row = stmt.get(electionID) as any;
        return row ? this.mapRowToElection(row) : null;
    }

    findByStatus(status: ElectionStatus): Election[] {
        const stmt = this.db.prepare(`
            SELECT * FROM elections WHERE status = ?
        `);

        const rows = stmt.all(status) as any[];
        return rows.map(row => this.mapRowToElection(row));
    }

    findActive(): Election[] {
        const now = new Date().toISOString();
        const stmt = this.db.prepare(`
            SELECT * FROM elections
            WHERE status = 'ACTIVE'
            AND start_date <= ?
            AND end_date >= ?
        `);

        const rows = stmt.all(now, now) as any[];
        return rows.map(row => this.mapRowToElection(row));
    }

    update(election: Election): void {
        const stmt = this.db.prepare(`
            UPDATE elections
            SET name = ?, election_type = ?, status = ?, start_date = ?, end_date = ?, description = ?
            WHERE election_id = ?
        `);

        stmt.run(
            election.name,
            election.electionType,
            election.status,
            election.startDate.toISOString(),
            election.endDate.toISOString(),
            election.description,
            election.electionID
        );
    }

    delete(electionID: string): void {
        const stmt = this.db.prepare(`
            DELETE FROM elections WHERE election_id = ?
        `);

        stmt.run(electionID);
    }

    findAll(): Election[] {
        const stmt = this.db.prepare(`
            SELECT * FROM elections
        `);

        const rows = stmt.all() as any[];
        return rows.map(row => this.mapRowToElection(row));
    }

    private mapRowToElection(row: any): Election {
        return new Election(
            row.election_id,
            row.name,
            row.election_type as ElectionType,
            new Date(row.start_date),
            new Date(row.end_date),
            row.description,
            row.status as ElectionStatus
        );
    }
}
