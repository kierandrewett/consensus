import { randomUUID } from 'crypto';
import { Ballot } from '../../domain/entities/Ballot';
import { ElectionType } from '../../domain/enums';

export class BallotFactory {
    /**
     * Create a ballot appropriate for the election type
     * @param electionType The type of election (FPTP, STV, AV, etc)
     * @param electionID The election identifier
     * @param candidateID The selected candidate (for FPTP)
     * @param preferences Ranked preferences (for STV/AV)
     * @returns A properly configured Ballot entity
     */
    static createBallot(
        electionType: ElectionType,
        electionID: string,
        candidateID?: string,
        preferences?: string[]
    ): Ballot {
        const ballotID = randomUUID();
        const castAt = new Date();

        switch (electionType) {
            case ElectionType.FPTP:
                // FPTP requires single candidate selection
                if (!candidateID) {
                    throw new Error('FPTP ballots require a candidateID');
                }
                // Store as single-item preferences array
                return new Ballot(ballotID, electionID, [candidateID], castAt);

            case ElectionType.STV:
            case ElectionType.AV:
            case ElectionType.PREFERENTIAL:
                // Preferential systems require ranked choices
                if (!preferences || preferences.length === 0) {
                    throw new Error(`${electionType} ballots require preferences`);
                }
                return new Ballot(ballotID, electionID, preferences, castAt);

            default:
                throw new Error(`Unknown election type: ${electionType}`);
        }
    }

    /**
     * Validate ballot data before creation
     * @param electionType The type of election
     * @param candidateID The selected candidate
     * @param preferences Ranked preferences
     * @returns true if valid, false otherwise
     */
    static validateBallotData(
        electionType: ElectionType,
        candidateID?: string,
        preferences?: string[]
    ): boolean {
        switch (electionType) {
            case ElectionType.FPTP:
                return candidateID !== undefined && preferences === undefined;

            case ElectionType.STV:
            case ElectionType.AV:
            case ElectionType.PREFERENTIAL:
                if (!preferences || preferences.length === 0) {
                    return false;
                }
                // Check for duplicates in preferences
                const uniquePrefs = new Set(preferences);
                return uniquePrefs.size === preferences.length;

            default:
                return false;
        }
    }
}
