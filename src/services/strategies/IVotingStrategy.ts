import { Ballot } from '../../domain/entities/Ballot';
import { Candidate } from '../../domain/entities/Candidate';

export interface VoteResult {
    candidateID: string;
    candidateName: string;
    votes: number;
    percentage: number;
    isWinner: boolean;
    isTied?: boolean;  // True when multiple candidates have the same top votes
}

export interface IVotingStrategy {
    /**
     * Calculate election results using this voting mechanism
     * @param ballots All ballots cast in the election
     * @param candidates All candidates in the election
     * @returns Ordered results with winner(s) marked
     */
    calculateResults(ballots: Ballot[], candidates: Candidate[]): VoteResult[];

    /**
     * Validate that a ballot is properly formed for this voting system
     * @param ballot The ballot to validate
     * @param candidateCount Number of candidates in the election
     * @returns true if valid, false otherwise
     */
    validateBallot(ballot: Ballot, candidateCount: number): boolean;
}
