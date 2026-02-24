import { IAuditLogRepository } from "../../repositories/interfaces/IAuditLogRepository";
import { ElectionEvent } from "../../domain/entities/ElectionEvent";
import { IElectionObserver } from "./interfaces/IElectionObserver";

export interface AuditEntry {
    electionID: string;
    electionName: string;
    previousStatus: string;
    newStatus: string;
    timestamp: Date;
}

export class ElectionAuditLogger implements IElectionObserver {
    constructor(private auditLogRepository: IAuditLogRepository) {}

    onElectionStateChange(event: ElectionEvent): void {
        const entry: AuditEntry = {
            electionID: event.election.electionID,
            electionName: event.election.name,
            previousStatus: event.previousStatus,
            newStatus: event.newStatus,
            timestamp: event.timestamp,
        };

        this.auditLogRepository.save(entry);

        console.log(
            `[Audit] Election "${entry.electionName}" transitioned: ${entry.previousStatus} -> ${entry.newStatus} at ${entry.timestamp.toISOString()}`
        );
    }

    getAuditLog(): AuditEntry[] {
        return this.auditLogRepository.findAll();
    }

    getEntriesForElection(electionID: string): AuditEntry[] {
        return this.auditLogRepository.findByElectionId(electionID);
    }

    getEntryCount(): number {
        return this.auditLogRepository.count();
    }
}
