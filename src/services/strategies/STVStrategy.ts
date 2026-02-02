import { Ballot } from '../../domain/entities/Ballot';
import { Candidate } from '../../domain/entities/Candidate';
import { IVotingStrategy, VoteResult } from './IVotingStrategy';

export class STVStrategy implements IVotingStrategy {
    calculateResults(ballots: Ballot[], candidates: Candidate[]): VoteResult[] {
        // Simplified STV implementation for single-winner scenario
        // In practice, STV is typically used for multi-winner elections

        const totalVotes = ballots.length;
        const quota = Math.floor(totalVotes / 2) + 1; // Droop quota for single winner

        let remainingBallots = ballots.map(b => ({
            ballot: b,
            currentPreference: 0
        }));

        const eliminated = new Set<string>();
        const voteCounts = new Map<string, number>();

        // Initialize vote counts
        candidates.forEach(c => voteCounts.set(c.candidateID, 0));

        // Count first preferences
        remainingBallots.forEach(rb => {
            if (rb.ballot.preferences && rb.ballot.preferences.length > 0) {
                const firstChoice = rb.ballot.preferences[0];
                voteCounts.set(firstChoice, (voteCounts.get(firstChoice) || 0) + 1);
            }
        });

        // Check if anyone meets quota
        let winner: string | null = null;
        for (const [candidateID, votes] of voteCounts.entries()) {
            if (votes >= quota) {
                winner = candidateID;
                break;
            }
        }

        // If no winner, eliminate lowest and redistribute (simplified - just one round)
        if (!winner && voteCounts.size > 1) {
            const sorted = Array.from(voteCounts.entries()).sort((a, b) => a[1] - b[1]);
            const lowestCandidate = sorted[0][0];
            eliminated.add(lowestCandidate);

            // Redistribute votes (simplified)
            remainingBallots.forEach(rb => {
                if (rb.ballot.preferences && rb.ballot.preferences[rb.currentPreference] === lowestCandidate) {
                    // Move to next preference
                    rb.currentPreference++;
                    if (rb.currentPreference < rb.ballot.preferences.length) {
                        const nextChoice = rb.ballot.preferences[rb.currentPreference];
                        if (!eliminated.has(nextChoice)) {
                            voteCounts.set(nextChoice, (voteCounts.get(nextChoice) || 0) + 1);
                        }
                    }
                }
            });

            voteCounts.delete(lowestCandidate);

            // Find winner after redistribution
            const maxVotes = Math.max(...Array.from(voteCounts.values()));
            for (const [candidateID, votes] of voteCounts.entries()) {
                if (votes === maxVotes) {
                    winner = candidateID;
                    break;
                }
            }
        }

        // Create results
        const results: VoteResult[] = candidates.map(candidate => {
            const votes = voteCounts.get(candidate.candidateID) || 0;
            return {
                candidateID: candidate.candidateID,
                candidateName: candidate.name,
                votes,
                percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
                isWinner: candidate.candidateID === winner
            };
        });

        results.sort((a, b) => b.votes - a.votes);

        return results;
    }

    validateBallot(ballot: Ballot, _candidateCount: number): boolean {
        // STV requires ranked preferences
        if (!ballot.preferences || ballot.preferences.length === 0) {
            return false;
        }

        // Check for duplicates
        const uniquePreferences = new Set(ballot.preferences);
        return uniquePreferences.size === ballot.preferences.length;
    }
}
