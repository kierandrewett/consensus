import { RegistrationStatus } from "../enums";

export class Voter {
    private _voterID: string;
    private _name: string;
    private _email: string;
    private _passwordHash: string;
    private _registrationStatus: RegistrationStatus;
    private _registrationDate: Date;

    constructor(
        voterID: string,
        name: string,
        email: string,
        passwordHash: string,
        registrationStatus: RegistrationStatus = RegistrationStatus.PENDING,
        registrationDate: Date = new Date()
    ) {
        this._voterID = voterID;
        this._name = name;
        this._email = email;
        this._passwordHash = passwordHash;
        this._registrationStatus = registrationStatus;
        this._registrationDate = registrationDate;
    }

    // Getters (Encapsulation)
    get voterID(): string {
        return this._voterID;
    }

    get name(): string {
        return this._name;
    }

    get email(): string {
        return this._email;
    }

    get passwordHash(): string {
        return this._passwordHash;
    }

    get registrationStatus(): RegistrationStatus {
        return this._registrationStatus;
    }

    get registrationDate(): Date {
        return this._registrationDate;
    }

    // Setters (Controlled mutation)
    set name(value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error("Name cannot be empty");
        }
        this._name = value;
    }

    set email(value: string) {
        if (!value || !value.includes("@")) {
            throw new Error("Invalid email address");
        }
        this._email = value;
    }

    set passwordHash(value: string) {
        if (!value || value.length === 0) {
            throw new Error("Password hash cannot be empty");
        }
        this._passwordHash = value;
    }

    set registrationStatus(value: RegistrationStatus) {
        this._registrationStatus = value;
    }

    // Business methods
    isApproved(): boolean {
        return this._registrationStatus === RegistrationStatus.APPROVED;
    }

    isSuspended(): boolean {
        return this._registrationStatus === RegistrationStatus.SUSPENDED;
    }

    canVote(): boolean {
        return this.isApproved() && !this.isSuspended();
    }
}
