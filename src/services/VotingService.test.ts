import { VotingService, CastVoteDTO } from './VotingService';
import { IBallotRepository } from '../repositories/interfaces/IBallotRepository';
import { IVoterEligibilityRepository } from '../repositories/interfaces/IVoterEligibilityRepository';
import { IVoteConfirmationRepository } from '../repositories/VoteConfirmationRepository';
import { IElectionRepository } from '../repositories/interfaces/IElectionRepository';
import { ICandidateRepository } from '../repositories/interfaces/ICandidateRepository';
import { Ballot } from '../domain/entities/Ballot';
import { VoteConfirmation } from '../domain/entities/VoteConfirmation';
import { Election } from '../domain/entities/Election';
import { Candidate } from '../domain/entities/Candidate';
import { Voter } from '../domain/entities/Voter';
import { ElectionType, ElectionStatus, RegistrationStatus } from '../domain/enums';

// Mock Repositories
class MockBallotRepository implements IBallotRepository {
    private ballots: Ballot[] = [];
    save(ballot: Ballot): void { this.ballots.push(ballot); }
    findById(ballotID: string): Ballot | null { return this.ballots.find(b => b.ballotID === ballotID) || null; }
    findByElectionId(electionID: string): Ballot[] { return this.ballots.filter(b => b.electionID === electionID); }
    countByElectionId(electionID: string): number { return this.findByElectionId(electionID).length; }
    countByCandidate(electionID: string, candidateID: string): number {
        return this.ballots.filter(b => b.electionID === electionID && b.isFor(candidateID)).length;
    }
}

class MockVoterEligibilityRepository implements IVoterEligibilityRepository {
    private voted: Set<string> = new Set();
    save(): void {}
    findByVoterAndElection(): null { return null; }
    findByVoterId(): [] { return []; }
    findByElectionId(): [] { return []; }
    hasVoted(voterID: string, electionID: string): boolean { return this.voted.has(`${voterID}:${electionID}`); }
    markVoted(voterID: string, electionID: string): void { this.voted.add(`${voterID}:${electionID}`); }
}

class MockVoteConfirmationRepository implements IVoteConfirmationRepository {
    private confirmations: VoteConfirmation[] = [];
    save(confirmation: VoteConfirmation): void { this.confirmations.push(confirmation); }
    findByVoterId(voterID: string): VoteConfirmation[] { return this.confirmations.filter(c => c.voterID === voterID); }
    findById(confirmationID: string): VoteConfirmation | null { return this.confirmations.find(c => c.confirmationID === confirmationID) || null; }
}

class MockElectionRepository implements IElectionRepository {
    private elections: Map<string, Election> = new Map();
    save(election: Election): void { this.elections.set(election.electionID, election); }
    findById(electionID: string): Election | null { return this.elections.get(electionID) || null; }
    findAll(): Election[] { return Array.from(this.elections.values()); }
    findActive(): Election[] { return Array.from(this.elections.values()).filter(e => e.status === ElectionStatus.ACTIVE); }
    findByStatus(status: ElectionStatus): Election[] { return Array.from(this.elections.values()).filter(e => e.status === status); }
    update(election: Election): void { this.elections.set(election.electionID, election); }
    delete(electionID: string): void { this.elections.delete(electionID); }
}

class MockCandidateRepository implements ICandidateRepository {
    private candidates: Map<string, Candidate> = new Map();
    save(candidate: Candidate): void { this.candidates.set(candidate.candidateID, candidate); }
    findById(candidateID: string): Candidate | null { return this.candidates.get(candidateID) || null; }
    findByElectionId(electionID: string): Candidate[] { return Array.from(this.candidates.values()).filter(c => c.electionID === electionID); }
    update(candidate: Candidate): void { this.candidates.set(candidate.candidateID, candidate); }
    delete(candidateID: string): void { this.candidates.delete(candidateID); }
}

describe('VotingService', () => {
    let service: VotingService;
    let ballotRepo: MockBallotRepository;
    let eligibilityRepo: MockVoterEligibilityRepository;
    let confirmationRepo: MockVoteConfirmationRepository;
    let electionRepo: MockElectionRepository;
    let candidateRepo: MockCandidateRepository;

    let activeElection: Election;
    let candidate1: Candidate;
    let candidate2: Candidate;
    let approvedVoter: Voter;

    beforeEach(() => {
        ballotRepo = new MockBallotRepository();
        eligibilityRepo = new MockVoterEligibilityRepository();
        confirmationRepo = new MockVoteConfirmationRepository();
        electionRepo = new MockElectionRepository();
        candidateRepo = new MockCandidateRepository();

        service = new VotingService(ballotRepo, eligibilityRepo, confirmationRepo, electionRepo, candidateRepo);

        // Setup fixtures
        const now = new Date();
        activeElection = new Election(
            'election-1',
            'Test Election',
            ElectionType.FPTP,
            new Date(now.getTime() - 3600000),
            new Date(now.getTime() + 86400000),
            'Test',
            ElectionStatus.ACTIVE
        );
        electionRepo.save(activeElection);

        candidate1 = new Candidate('c1', 'election-1', 'Alice', 'Party A', 'Bio A');
        candidate2 = new Candidate('c2', 'election-1', 'Bob', 'Party B', 'Bio B');
        candidateRepo.save(candidate1);
        candidateRepo.save(candidate2);

        approvedVoter = new Voter('voter-1', 'Test Voter', 'test@example.com', 'hash', RegistrationStatus.APPROVED);
    });

    describe('FR2: Cast Vote', () => {
        it('should cast a valid FPTP vote', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            const confirmation = service.castVote(approvedVoter, dto);

            expect(confirmation).toBeDefined();
            expect(confirmation.voterID).toBe('voter-1');
        });

        it('should persist ballot to repository', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            service.castVote(approvedVoter, dto);

            expect(ballotRepo.findByElectionId('election-1')).toHaveLength(1);
        });

        it('should mark voter as having voted', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            service.castVote(approvedVoter, dto);

            expect(service.hasVoted('voter-1', 'election-1')).toBe(true);
        });

        it('should reject vote from non-approved voter', () => {
            const pendingVoter = new Voter('v2', 'Pending', 'pending@example.com', 'hash', RegistrationStatus.PENDING);
            const dto: CastVoteDTO = { voterID: 'v2', electionID: 'election-1', candidateID: 'c1' };

            expect(() => service.castVote(pendingVoter, dto)).toThrow('Voter is not approved');
        });

        it('should reject duplicate vote', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            service.castVote(approvedVoter, dto);

            expect(() => service.castVote(approvedVoter, dto)).toThrow('Voter has already voted in this election');
        });

        it('should reject vote for non-existent election', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'non-existent', candidateID: 'c1' };

            expect(() => service.castVote(approvedVoter, dto)).toThrow('Election not found');
        });

        it('should reject vote for invalid candidate', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'invalid' };

            expect(() => service.castVote(approvedVoter, dto)).toThrow('Invalid candidate ID');
        });
    });

    describe('FR3: Digital Confirmation', () => {
        it('should return confirmation with unique ID', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            const confirmation = service.castVote(approvedVoter, dto);

            expect(confirmation.confirmationID).toBeDefined();
            expect(confirmation.confirmationID.length).toBeGreaterThan(0);
        });

        it('should store confirmation for later retrieval', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            service.castVote(approvedVoter, dto);

            expect(service.getVoterConfirmations('voter-1')).toHaveLength(1);
        });
    });

    describe('NFR: Privacy (Ballot Anonymity)', () => {
        it('should store anonymous ballot with no voter identification', () => {
            const dto: CastVoteDTO = { voterID: 'voter-1', electionID: 'election-1', candidateID: 'c1' };

            service.castVote(approvedVoter, dto);

            const ballots = ballotRepo.findByElectionId('election-1');
            expect(JSON.stringify(ballots[0])).not.toContain('voter-1');
        });
    });

    describe('Result Calculation', () => {
        beforeEach(() => {
            const now = new Date();
            const closedElection = new Election(
                'closed',
                'Closed',
                ElectionType.FPTP,
                new Date(now.getTime() - 172800000),
                new Date(now.getTime() - 86400000),
                'Closed',
                ElectionStatus.CLOSED
            );
            electionRepo.save(closedElection);

            candidateRepo.save(new Candidate('closed-c1', 'closed', 'Winner', 'P1', 'B1'));
            candidateRepo.save(new Candidate('closed-c2', 'closed', 'Loser', 'P2', 'B2'));

            ballotRepo.save(new Ballot('b1', 'closed', ['closed-c1']));
            ballotRepo.save(new Ballot('b2', 'closed', ['closed-c1']));
            ballotRepo.save(new Ballot('b3', 'closed', ['closed-c2']));
        });

        it('should calculate FPTP results for closed election', () => {
            const results = service.calculateResults('closed');

            expect(results).toHaveLength(2);
            expect(results.find(r => r.candidateID === 'closed-c1')?.votes).toBe(2);
            expect(results.find(r => r.candidateID === 'closed-c2')?.votes).toBe(1);
        });

        it('should reject results request for active election', () => {
            expect(() => service.calculateResults('election-1')).toThrow('Results only available for closed elections');
        });

        it('should return vote count for election', () => {
            expect(service.getVoteCount('closed')).toBe(3);
        });
    });
});
