import { Election } from "../../domain/entities/Election";
import { ElectionStatus } from "../../domain/enums";

export interface IElectionRepository {
    save(election: Election): void;
    findById(electionID: string): Election | null;
    findByStatus(status: ElectionStatus): Election[];
    findActive(): Election[];
    update(election: Election): void;
    delete(electionID: string): void;
    findAll(): Election[];
}
