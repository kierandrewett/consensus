import Database from "better-sqlite3";
import { DatabaseConnection } from "../db/connection";
import { AuditEntry } from "../services/observers/ElectionAuditLogger";
import { IAuditLogRepository } from "./interfaces/IAuditLogRepository";

export class AuditLogRepository implements IAuditLogRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(entry: AuditEntry): void {
        const stmt = this.db.prepare(`
            INSERT INTO election_audit_log (election_id, election_name, previous_status, new_status, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(
            entry.electionID,
            entry.electionName,
            entry.previousStatus,
            entry.newStatus,
            entry.timestamp.toISOString()
        );
    }

    findAll(): AuditEntry[] {
        const stmt = this.db.prepare(
            "SELECT election_id, election_name, previous_status, new_status, timestamp FROM election_audit_log ORDER BY id ASC"
        );
        const rows = stmt.all() as any[];
        return rows.map((row) => this.mapRowToEntry(row));
    }

    findByElectionId(electionID: string): AuditEntry[] {
        const stmt = this.db.prepare(
            "SELECT election_id, election_name, previous_status, new_status, timestamp FROM election_audit_log WHERE election_id = ? ORDER BY id ASC"
        );
        const rows = stmt.all(electionID) as any[];
        return rows.map((row) => this.mapRowToEntry(row));
    }

    count(): number {
        const stmt = this.db.prepare("SELECT COUNT(*) as count FROM election_audit_log");
        const row = stmt.get() as { count: number };
        return row.count;
    }

    private mapRowToEntry(row: any): AuditEntry {
        return {
            electionID: row.election_id,
            electionName: row.election_name,
            previousStatus: row.previous_status,
            newStatus: row.new_status,
            timestamp: new Date(row.timestamp),
        };
    }
}
