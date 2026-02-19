import Database from "better-sqlite3";
import { DatabaseConnection } from "../db/connection";

export interface TieResolution {
    resolutionID: string;
    electionID: string;
    resolutionType: "RANDOM" | "MANUAL" | "RECALL";
    winnerCandidateID: string | null;
    resolvedBy: string;
    resolvedAt: Date;
    notes: string | null;
}

export interface ITieResolutionRepository {
    save(resolution: TieResolution): void;
    findByElectionId(electionID: string): TieResolution | null;
    delete(resolutionID: string): void;
}

export class TieResolutionRepository implements ITieResolutionRepository {
    private db: Database.Database;

    constructor(db?: Database.Database) {
        this.db = db || DatabaseConnection.getInstance();
    }

    save(resolution: TieResolution): void {
        const stmt = this.db.prepare(`
            INSERT INTO tie_resolutions (resolution_id, election_id, resolution_type, winner_candidate_id, resolved_by, resolved_at, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            resolution.resolutionID,
            resolution.electionID,
            resolution.resolutionType,
            resolution.winnerCandidateID,
            resolution.resolvedBy,
            resolution.resolvedAt.toISOString(),
            resolution.notes
        );
    }

    findByElectionId(electionID: string): TieResolution | null {
        const stmt = this.db.prepare(`
            SELECT * FROM tie_resolutions WHERE election_id = ?
        `);

        const row = stmt.get(electionID) as any;
        return row ? this.mapRowToResolution(row) : null;
    }

    delete(resolutionID: string): void {
        const stmt = this.db.prepare(`
            DELETE FROM tie_resolutions WHERE resolution_id = ?
        `);
        stmt.run(resolutionID);
    }

    private mapRowToResolution(row: any): TieResolution {
        return {
            resolutionID: row.resolution_id,
            electionID: row.election_id,
            resolutionType: row.resolution_type,
            winnerCandidateID: row.winner_candidate_id,
            resolvedBy: row.resolved_by,
            resolvedAt: new Date(row.resolved_at),
            notes: row.notes,
        };
    }
}
