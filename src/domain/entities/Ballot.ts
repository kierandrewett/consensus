export class Ballot {
    constructor(
        public readonly ballotID: string,
        public readonly electionID: string,
        public readonly preferences: string[], // Array of candidate IDs (single for FPTP, multiple for preferential)
        public readonly castAt: Date = new Date()
    ) {}

    /**
     * Check if ballot is for a specific candidate
     */
    isFor(candidateID: string): boolean {
        return this.preferences.includes(candidateID);
    }

    /**
     * Get preference rank for a candidate (1-based)
     */
    getPreferenceRank(candidateID: string): number | null {
        const index = this.preferences.indexOf(candidateID);
        return index >= 0 ? index + 1 : null;
    }
}
