import { Election } from "./Election";
import { ElectionStatus } from "../enums";

export class ElectionEvent {
    private _election: Election;
    private _previousStatus: ElectionStatus;
    private _newStatus: ElectionStatus;
    private _timestamp: Date;

    constructor(
        election: Election,
        previousStatus: ElectionStatus,
        newStatus: ElectionStatus,
        timestamp: Date = new Date()
    ) {
        this._election = election;
        this._previousStatus = previousStatus;
        this._newStatus = newStatus;
        this._timestamp = timestamp;
    }

    get election(): Election {
        return this._election;
    }

    get previousStatus(): ElectionStatus {
        return this._previousStatus;
    }

    get newStatus(): ElectionStatus {
        return this._newStatus;
    }

    get timestamp(): Date {
        return this._timestamp;
    }
}
