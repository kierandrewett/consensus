import { Voter } from './Voter';
import { RegistrationStatus } from '../enums';

describe('Voter Entity', () => {
    describe('Construction', () => {
        it('should create a voter with all required properties', () => {
            const voter = new Voter(
                'voter-123',
                'John Doe',
                'john@example.com',
                'hashedPassword123',
                RegistrationStatus.PENDING,
                new Date('2024-01-01')
            );

            expect(voter.voterID).toBe('voter-123');
            expect(voter.name).toBe('John Doe');
            expect(voter.email).toBe('john@example.com');
            expect(voter.passwordHash).toBe('hashedPassword123');
            expect(voter.registrationStatus).toBe(RegistrationStatus.PENDING);
        });

        it('should default to PENDING status when not specified', () => {
            const voter = new Voter(
                'voter-456',
                'Jane Doe',
                'jane@example.com',
                'hashedPassword456'
            );

            expect(voter.registrationStatus).toBe(RegistrationStatus.PENDING);
        });
    });

    describe('Encapsulation - Getters', () => {
        let voter: Voter;

        beforeEach(() => {
            voter = new Voter(
                'voter-test',
                'Test User',
                'test@example.com',
                'hashedPassword',
                RegistrationStatus.APPROVED
            );
        });

        it('should expose voterID through getter', () => {
            expect(voter.voterID).toBe('voter-test');
        });

        it('should expose name through getter', () => {
            expect(voter.name).toBe('Test User');
        });

        it('should expose email through getter', () => {
            expect(voter.email).toBe('test@example.com');
        });
    });

    describe('Encapsulation - Setters', () => {
        let voter: Voter;

        beforeEach(() => {
            voter = new Voter(
                'voter-test',
                'Original Name',
                'original@example.com',
                'originalHash',
                RegistrationStatus.PENDING
            );
        });

        it('should allow updating name through setter', () => {
            voter.name = 'Updated Name';
            expect(voter.name).toBe('Updated Name');
        });

        it('should allow updating registrationStatus through setter', () => {
            voter.registrationStatus = RegistrationStatus.APPROVED;
            expect(voter.registrationStatus).toBe(RegistrationStatus.APPROVED);
        });
    });

    describe('Registration Status Transitions', () => {
        it('should allow PENDING -> APPROVED', () => {
            const voter = new Voter('v1', 'Test', 'test@example.com', 'hash', RegistrationStatus.PENDING);
            voter.registrationStatus = RegistrationStatus.APPROVED;
            expect(voter.registrationStatus).toBe(RegistrationStatus.APPROVED);
        });

        it('should allow PENDING -> REJECTED', () => {
            const voter = new Voter('v2', 'Test', 'test@example.com', 'hash', RegistrationStatus.PENDING);
            voter.registrationStatus = RegistrationStatus.REJECTED;
            expect(voter.registrationStatus).toBe(RegistrationStatus.REJECTED);
        });

        it('should allow APPROVED -> SUSPENDED', () => {
            const voter = new Voter('v3', 'Test', 'test@example.com', 'hash', RegistrationStatus.APPROVED);
            voter.registrationStatus = RegistrationStatus.SUSPENDED;
            expect(voter.registrationStatus).toBe(RegistrationStatus.SUSPENDED);
        });
    });

    describe('All Registration Statuses', () => {
        it.each([
            RegistrationStatus.PENDING,
            RegistrationStatus.APPROVED,
            RegistrationStatus.REJECTED,
            RegistrationStatus.SUSPENDED
        ])('should accept %s as valid registration status', (status) => {
            const voter = new Voter('v', 'Test', 'test@example.com', 'hash', status);
            expect(voter.registrationStatus).toBe(status);
        });
    });
});
