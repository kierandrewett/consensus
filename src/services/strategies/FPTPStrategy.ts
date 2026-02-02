import { Ballot } from '../../domain/entities/Ballot';
import { Candidate } from '../../domain/entities/Candidate';
import { IVotingStrategy, VoteResult } from './IVotingStrategy';

export class FPTPStrategy implements IVotingStrategy {
    calculateResults(ballots: Ballot[], candidates: Candidate[]): VoteResult[] {
        // Count votes for each candidate
        const voteCounts = new Map<string, number>();
        candidates.forEach(c => voteCounts.set(c.candidateID, 0));

        ballots.forEach(ballot => {
            // For FPTP, preferences array has single item
            const candidateID = ballot.preferences[0];
            const currentCount = voteCounts.get(candidateID) || 0;
            voteCounts.set(candidateID, currentCount + 1);
        });

        const totalVotes = ballots.length;

        // Create results
        const results: VoteResult[] = candidates.map(candidate => {
            const votes = voteCounts.get(candidate.candidateID) || 0;
            return {
                candidateID: candidate.candidateID,
                candidateName: candidate.name,
                votes,
                percentage: totalVotes > 0 ? (votes / totalVotes) * 100 : 0,
                isWinner: false
            };
        });

        // Sort by votes descending
        results.sort((a, b) => b.votes - a.votes);

        // Check for ties at the top
        if (results.length > 0 && results[0].votes > 0) {
            const topVotes = results[0].votes;
            const tiedCandidates = results.filter(r => r.votes === topVotes);
            
            if (tiedCandidates.length > 1) {
                // Tie detected - flag for admin resolution, no automatic winner
                tiedCandidates.forEach(r => {
                    r.isTied = true;
                    r.isWinner = false;
                });
            } else {
                // Clear winner
                results[0].isWinner = true;
            }
        }

        return results;
    }

    validateBallot(ballot: Ballot, _candidateCount: number): boolean {
        // FPTP requires single candidate selection (single-item preferences array)
        return ballot.preferences && ballot.preferences.length === 1;
    }
}
