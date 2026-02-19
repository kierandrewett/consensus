export class Ballot {
    private _ballotID: string;
    private _electionID: string;
    private _choices: string[]; // Array of candidate IDs in preference order
    private _timestamp: Date;

    constructor(ballotID: string, electionID: string, choices: string[], timestamp: Date = new Date()) {
        this._ballotID = ballotID;
        this._electionID = electionID;
        this._choices = choices;
        this._timestamp = timestamp;
    }

    // Getters
    get ballotID(): string {
        return this._ballotID;
    }

    get electionID(): string {
        return this._electionID;
    }

    get choices(): string[] {
        return [...this._choices]; // Return copy for encapsulation
    }

    get timestamp(): Date {
        return this._timestamp;
    }

    // Validation method
    validate(validCandidateIDs: string[]): boolean {
        // Check all choices are valid candidate IDs
        for (const choice of this._choices) {
            if (!validCandidateIDs.includes(choice)) {
                return false;
            }
        }

        // Check for duplicates
        const uniqueChoices = new Set(this._choices);
        if (uniqueChoices.size !== this._choices.length) {
            return false;
        }

        return true;
    }

    getFirstChoice(): string | null {
        return this._choices.length > 0 ? this._choices[0] : null;
    }
}
