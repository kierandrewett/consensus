import { AnonymousBallotAdapter, VoteInput } from './AnonymousBallotAdapter';
import { Voter } from '../../domain/entities/Voter';
import { RegistrationStatus } from '../../domain/enums';

describe('AnonymousBallotAdapter (Adapter Pattern)', () => {
    let adapter: AnonymousBallotAdapter;
    let testVoter: Voter;

    beforeEach(() => {
        adapter = new AnonymousBallotAdapter();
        testVoter = new Voter('voter-123', 'John Doe', 'john@example.com', 'hash', RegistrationStatus.APPROVED);
    });

    describe('adapt() - FPTP votes', () => {
        it('should create anonymous ballot from FPTP vote input', () => {
            const voteInput: VoteInput = {
                voter: testVoter,
                electionID: 'election-1',
                candidateID: 'candidate-A'
            };

            const output = adapter.adapt(voteInput);

            expect(output.ballot).toBeDefined();
            expect(output.ballot.electionID).toBe('election-1');
            expect(output.ballot.preferences).toEqual(['candidate-A']);
        });

        it('should create confirmation with voter ID but NO vote details', () => {
            const voteInput: VoteInput = {
                voter: testVoter,
                electionID: 'election-1',
                candidateID: 'candidate-A'
            };

            const output = adapter.adapt(voteInput);

            expect(output.confirmation.voterID).toBe('voter-123');
            expect(output.confirmation.electionID).toBe('election-1');
            expect(output.confirmation).not.toHaveProperty('candidateID');
            expect(output.confirmation).not.toHaveProperty('preferences');
        });

        it('should NOT include voter ID in ballot', () => {
            const voteInput: VoteInput = {
                voter: testVoter,
                electionID: 'election-1',
                candidateID: 'candidate-A'
            };

            const output = adapter.adapt(voteInput);

            expect(output.ballot).not.toHaveProperty('voterID');
            expect(output.ballot).not.toHaveProperty('voter');
        });
    });

    describe('adapt() - Preferential votes', () => {
        it('should create anonymous ballot from preferential vote input', () => {
            const voteInput: VoteInput = {
                voter: testVoter,
                electionID: 'election-2',
                preferences: ['candidate-A', 'candidate-B', 'candidate-C']
            };

            const output = adapter.adapt(voteInput);

            expect(output.ballot.electionID).toBe('election-2');
            expect(output.ballot.preferences).toEqual(['candidate-A', 'candidate-B', 'candidate-C']);
        });
    });

    describe('adapt() - Unique IDs', () => {
        it('should generate unique ballot IDs', () => {
            const voteInput: VoteInput = { voter: testVoter, electionID: 'e1', candidateID: 'c1' };

            const output1 = adapter.adapt(voteInput);
            const output2 = adapter.adapt(voteInput);

            expect(output1.ballot.ballotID).not.toBe(output2.ballot.ballotID);
        });

        it('should generate unique confirmation IDs', () => {
            const voteInput: VoteInput = { voter: testVoter, electionID: 'e1', candidateID: 'c1' };

            const output1 = adapter.adapt(voteInput);
            const output2 = adapter.adapt(voteInput);

            expect(output1.confirmation.confirmationID).not.toBe(output2.confirmation.confirmationID);
        });
    });

    describe('adapt() - Error handling', () => {
        it('should throw error when neither candidateID nor preferences provided', () => {
            const voteInput: VoteInput = { voter: testVoter, electionID: 'e1' };

            expect(() => adapter.adapt(voteInput)).toThrow('Either candidateID or preferences must be provided');
        });
    });

    describe('verifyAnonymity()', () => {
        it('should return true for properly anonymous ballot', () => {
            const voteInput: VoteInput = { voter: testVoter, electionID: 'e1', candidateID: 'c1' };

            const output = adapter.adapt(voteInput);
            const isAnonymous = adapter.verifyAnonymity(output.ballot);

            expect(isAnonymous).toBe(true);
        });
    });
});
