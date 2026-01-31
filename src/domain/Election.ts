import { ElectionType, ElectionStatus } from './enums';
import { Candidate } from './Candidate';

export class Election {
    private _electionID: string;
    private _name: string;
    private _electionType: ElectionType;
    private _status: ElectionStatus;
    private _startDate: Date;
    private _endDate: Date;
    private _description: string;
    private _candidates: Candidate[];

    constructor(
        electionID: string,
        name: string,
        electionType: ElectionType,
        startDate: Date,
        endDate: Date,
        description: string,
        status: ElectionStatus = ElectionStatus.DRAFT
    ) {
        this._electionID = electionID;
        this._name = name;
        this._electionType = electionType;
        this._status = status;
        this._startDate = startDate;
        this._endDate = endDate;
        this._description = description;
        this._candidates = [];
    }

    // Getters
    get electionID(): string {
        return this._electionID;
    }

    get name(): string {
        return this._name;
    }

    get electionType(): ElectionType {
        return this._electionType;
    }

    get status(): ElectionStatus {
        return this._status;
    }

    get startDate(): Date {
        return this._startDate;
    }

    get endDate(): Date {
        return this._endDate;
    }

    get description(): string {
        return this._description;
    }

    get candidates(): Candidate[] {
        return [...this._candidates]; // Return copy for encapsulation
    }

    // Setters
    set status(value: ElectionStatus) {
        this._status = value;
    }

    set name(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('Election name cannot be empty');
        }
        this._name = value;
    }

    // Business methods
    isActive(): boolean {
        const now = new Date();
        return this._status === ElectionStatus.ACTIVE &&
               now >= this._startDate &&
               now <= this._endDate;
    }

    isClosed(): boolean {
        return this._status === ElectionStatus.CLOSED;
    }

    addCandidate(candidate: Candidate): void {
        if (this._status !== ElectionStatus.DRAFT) {
            throw new Error('Cannot add candidates to non-draft election');
        }
        this._candidates.push(candidate);
    }

    removeCandidate(candidateID: string): void {
        if (this._status !== ElectionStatus.DRAFT) {
            throw new Error('Cannot remove candidates from non-draft election');
        }
        this._candidates = this._candidates.filter(c => c.candidateID !== candidateID);
    }

    getCandidateCount(): number {
        return this._candidates.length;
    }
}
