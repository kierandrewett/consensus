import { randomUUID } from 'crypto';
import { Voter } from '../../domain/entities/Voter';
import { Ballot } from '../../domain/entities/Ballot';
import { VoteConfirmation } from '../../domain/entities/VoteConfirmation';

export interface VoteInput {
    voter: Voter;
    electionID: string;
    candidateID?: string;
    preferences?: string[];
}

export interface AnonymousVoteOutput {
    ballot: Ballot;
    confirmation: VoteConfirmation;
}

export class AnonymousBallotAdapter {
    adapt(voteInput: VoteInput): AnonymousVoteOutput {
        const now = new Date();

        // Determine preferences array (single item for FPTP, multiple for preferential)
        let preferences: string[];
        if (voteInput.preferences && voteInput.preferences.length > 0) {
            preferences = voteInput.preferences;
        } else if (voteInput.candidateID) {
            preferences = [voteInput.candidateID];
        } else {
            throw new Error('Either candidateID or preferences must be provided');
        }

        // Create anonymous ballot - no reference to voter
        const ballot = new Ballot(
            randomUUID(),
            voteInput.electionID,
            preferences,
            now
        );

        // Create confirmation for voter - no vote details
        const confirmation = new VoteConfirmation(
            randomUUID(),
            voteInput.voter.voterID,
            voteInput.electionID,
            now
        );

        return {
            ballot,
            confirmation
        };
    }

    verifyAnonymity(ballot: Ballot): boolean {
        return ballot.ballotID !== undefined &&
               ballot.electionID !== undefined &&
               ballot.castAt !== undefined;
    }
}
