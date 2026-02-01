export class VoteConfirmation {
    constructor(
        public readonly confirmationID: string,
        public readonly voterID: string,
        public readonly electionID: string,
        public readonly confirmedAt: Date
    ) {}

    /**
     * Generate a human-readable confirmation code
     */
    getConfirmationCode(): string {
        return this.confirmationID.substring(0, 8).toUpperCase();
    }
}
