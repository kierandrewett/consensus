import { VoterEligibility } from '../../domain/entities/VoterEligibility';

export interface IVoterEligibilityRepository {
    save(eligibility: VoterEligibility): void;
    findByVoterAndElection(voterID: string, electionID: string): VoterEligibility | null;
    findByVoterId(voterID: string): VoterEligibility[];
    findByElectionId(electionID: string): VoterEligibility[];
    hasVoted(voterID: string, electionID: string): boolean;
    markVoted(voterID: string, electionID: string): void;
}
