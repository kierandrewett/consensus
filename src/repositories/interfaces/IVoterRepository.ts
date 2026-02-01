import { Voter } from '../../domain/entities/Voter';

export interface IVoterRepository {
    save(voter: Voter): void;
    findById(voterID: string): Voter | null;
    findByEmail(email: string): Voter | null;
    update(voter: Voter): void;
    delete(voterID: string): void;
    findAll(): Voter[];
}
