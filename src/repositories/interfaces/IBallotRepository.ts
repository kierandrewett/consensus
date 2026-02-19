import { Ballot } from "../../domain/entities/Ballot";

export interface IBallotRepository {
    save(ballot: Ballot): void;
    findById(ballotID: string): Ballot | null;
    findByElectionId(electionID: string): Ballot[];
    countByElectionId(electionID: string): number;
    countByCandidate(electionID: string, candidateID: string): number;
}
