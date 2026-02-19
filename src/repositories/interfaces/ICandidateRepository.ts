import { Candidate } from "../../domain/entities/Candidate";

export interface ICandidateRepository {
    save(candidate: Candidate): void;
    findById(candidateID: string): Candidate | null;
    findByElectionId(electionID: string): Candidate[];
    update(candidate: Candidate): void;
    delete(candidateID: string): void;
}
