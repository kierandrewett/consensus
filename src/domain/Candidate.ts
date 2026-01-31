export class Candidate {
    private _candidateID: string;
    private _electionID: string;
    private _name: string;
    private _party: string;
    private _biography: string;

    constructor(
        candidateID: string,
        electionID: string,
        name: string,
        party: string,
        biography: string
    ) {
        this._candidateID = candidateID;
        this._electionID = electionID;
        this._name = name;
        this._party = party;
        this._biography = biography;
    }

    // Getters
    get candidateID(): string {
        return this._candidateID;
    }

    get electionID(): string {
        return this._electionID;
    }

    get name(): string {
        return this._name;
    }

    get party(): string {
        return this._party;
    }

    get biography(): string {
        return this._biography;
    }

    // Setters
    set name(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('Candidate name cannot be empty');
        }
        this._name = value;
    }

    set party(value: string) {
        this._party = value;
    }

    set biography(value: string) {
        this._biography = value;
    }
}
