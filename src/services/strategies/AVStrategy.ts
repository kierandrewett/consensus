import { Ballot } from "../../domain/entities/Ballot";
import { Candidate } from "../../domain/entities/Candidate";
import { IVotingStrategy, VoteResult } from "./IVotingStrategy";

export class AVStrategy implements IVotingStrategy {
    calculateResults(ballots: Ballot[], candidates: Candidate[]): VoteResult[] {
        const totalVotes = ballots.length;
        const majority = Math.floor(totalVotes / 2) + 1;

        let activeCandidates = new Set(candidates.map((c) => c.candidateID));
        let ballotStates = ballots.map((b) => ({
            ballot: b,
            currentPreference: 0,
        }));

        let finalCounts = new Map<string, number>();

        // Run rounds until we have a winner or run out of candidates
        while (activeCandidates.size > 1) {
            // Count votes at current preference level
            const roundCounts = new Map<string, number>();
            activeCandidates.forEach((c) => roundCounts.set(c, 0));

            ballotStates.forEach((bs) => {
                if (bs.ballot.preferences && bs.currentPreference < bs.ballot.preferences.length) {
                    const currentChoice = bs.ballot.preferences[bs.currentPreference];
                    if (activeCandidates.has(currentChoice)) {
                        roundCounts.set(currentChoice, (roundCounts.get(currentChoice) || 0) + 1);
                    } else {
                        // This candidate eliminated, move to next preference
                        bs.currentPreference++;
                        while (bs.currentPreference < bs.ballot.preferences.length) {
                            const nextChoice = bs.ballot.preferences[bs.currentPreference];
                            if (activeCandidates.has(nextChoice)) {
                                roundCounts.set(nextChoice, (roundCounts.get(nextChoice) || 0) + 1);
                                break;
                            }
                            bs.currentPreference++;
                        }
                    }
                }
            });

            // Check for majority winner
            let winner: string | null = null;
            for (const [candidateID, votes] of roundCounts.entries()) {
                if (votes >= majority) {
                    winner = candidateID;
                    finalCounts = roundCounts;
                    break;
                }
            }

            if (winner) {
                break;
            }

            // No winner, eliminate candidate with fewest votes
            const sorted = Array.from(roundCounts.entries()).sort((a, b) => a[1] - b[1]);
            if (sorted.length > 0) {
                const toEliminate = sorted[0][0];
                activeCandidates.delete(toEliminate);
                finalCounts = roundCounts;
            } else {
                break;
            }
        }

        // If only one candidate left, they win
        if (activeCandidates.size === 1) {
            const lastCandidate = Array.from(activeCandidates)[0];
            if (!finalCounts.has(lastCandidate)) {
                finalCounts.set(lastCandidate, 0);
            }
        }

        // Create results
        const maxVotes = Math.max(...Array.from(finalCounts.values()));
        const results: VoteResult[] = candidates.map((candidate) => {
            const votes = finalCounts.get(candidate.candidateID) || 0;
            return {
                candidateID: candidate.candidateID,
                candidateName: candidate.name,
                votes,
                percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
                isWinner: votes === maxVotes && votes > 0,
            };
        });

        results.sort((a, b) => b.votes - a.votes);

        return results;
    }

    validateBallot(ballot: Ballot, _candidateCount: number): boolean {
        // AV requires ranked preferences
        if (!ballot.preferences || ballot.preferences.length === 0) {
            return false;
        }

        // Check for duplicates
        const uniquePreferences = new Set(ballot.preferences);
        return uniquePreferences.size === ballot.preferences.length;
    }
}
