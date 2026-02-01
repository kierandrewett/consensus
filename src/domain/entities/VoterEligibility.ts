export class VoterEligibility {
    constructor(
        public readonly voterID: string,
        public readonly electionID: string,
        public readonly hasVoted: boolean,
        public readonly votedAt?: Date
    ) {}

    /**
     * Create initial eligibility record
     */
    static createInitial(voterID: string, electionID: string): VoterEligibility {
        return new VoterEligibility(voterID, electionID, false);
    }

    /**
     * Mark as voted
     */
    markAsVoted(): VoterEligibility {
        return new VoterEligibility(this.voterID, this.electionID, true, new Date());
    }
}
