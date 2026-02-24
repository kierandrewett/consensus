import { AuditEntry } from "../../services/observers/ElectionAuditLogger";

export interface IAuditLogRepository {
    save(entry: AuditEntry): void;
    findAll(): AuditEntry[];
    findByElectionId(electionID: string): AuditEntry[];
    count(): number;
}
