import { BallotFactory } from './BallotFactory';
import { ElectionType } from '../../domain/enums';

describe('BallotFactory (Factory Method Pattern)', () => {
    describe('createBallot() - FPTP', () => {
        it('should create FPTP ballot with single candidate selection', () => {
            const ballot = BallotFactory.createBallot(ElectionType.FPTP, 'election-1', 'candidate-A');

            expect(ballot).toBeDefined();
            expect(ballot.electionID).toBe('election-1');
            expect(ballot.preferences).toEqual(['candidate-A']);
            expect(ballot.preferences).toHaveLength(1);
        });

        it('should generate unique ballotID', () => {
            const ballot1 = BallotFactory.createBallot(ElectionType.FPTP, 'election-1', 'candidate-A');
            const ballot2 = BallotFactory.createBallot(ElectionType.FPTP, 'election-1', 'candidate-A');
            expect(ballot1.ballotID).not.toBe(ballot2.ballotID);
        });

        it('should throw error when candidateID is missing for FPTP', () => {
            expect(() => {
                BallotFactory.createBallot(ElectionType.FPTP, 'election-1');
            }).toThrow('FPTP ballots require a candidateID');
        });
    });

    describe('createBallot() - STV', () => {
        it('should create STV ballot with ranked preferences', () => {
            const preferences = ['candidate-A', 'candidate-B', 'candidate-C'];
            const ballot = BallotFactory.createBallot(ElectionType.STV, 'election-2', undefined, preferences);

            expect(ballot.electionID).toBe('election-2');
            expect(ballot.preferences).toEqual(preferences);
            expect(ballot.preferences).toHaveLength(3);
        });

        it('should throw error when preferences are missing for STV', () => {
            expect(() => {
                BallotFactory.createBallot(ElectionType.STV, 'election-2');
            }).toThrow('STV ballots require preferences');
        });

        it('should throw error when preferences array is empty for STV', () => {
            expect(() => {
                BallotFactory.createBallot(ElectionType.STV, 'election-2', undefined, []);
            }).toThrow('STV ballots require preferences');
        });
    });

    describe('createBallot() - AV', () => {
        it('should create AV ballot with ranked preferences', () => {
            const preferences = ['candidate-1', 'candidate-2'];
            const ballot = BallotFactory.createBallot(ElectionType.AV, 'election-3', undefined, preferences);

            expect(ballot.electionID).toBe('election-3');
            expect(ballot.preferences).toEqual(preferences);
        });

        it('should throw error when preferences are missing for AV', () => {
            expect(() => {
                BallotFactory.createBallot(ElectionType.AV, 'election-3');
            }).toThrow('AV ballots require preferences');
        });
    });

    describe('createBallot() - PREFERENTIAL', () => {
        it('should create PREFERENTIAL ballot with ranked preferences', () => {
            const preferences = ['candidate-X', 'candidate-Y', 'candidate-Z'];
            const ballot = BallotFactory.createBallot(ElectionType.PREFERENTIAL, 'election-4', undefined, preferences);

            expect(ballot.electionID).toBe('election-4');
            expect(ballot.preferences).toEqual(preferences);
        });
    });

    describe('createBallot() - Unknown Type', () => {
        it('should throw error for unknown election type', () => {
            expect(() => {
                BallotFactory.createBallot('UNKNOWN' as ElectionType, 'election-5', 'candidate-A');
            }).toThrow('Unknown election type');
        });
    });

    describe('validateBallotData()', () => {
        it('should return true for valid FPTP data', () => {
            expect(BallotFactory.validateBallotData(ElectionType.FPTP, 'candidate-A')).toBe(true);
        });

        it('should return false when candidateID is missing for FPTP', () => {
            expect(BallotFactory.validateBallotData(ElectionType.FPTP)).toBe(false);
        });

        it('should return true for valid STV data', () => {
            expect(BallotFactory.validateBallotData(ElectionType.STV, undefined, ['a', 'b'])).toBe(true);
        });

        it('should return false when preferences missing for STV', () => {
            expect(BallotFactory.validateBallotData(ElectionType.STV)).toBe(false);
        });

        it('should return false for empty preferences array', () => {
            expect(BallotFactory.validateBallotData(ElectionType.STV, undefined, [])).toBe(false);
        });
    });
});
