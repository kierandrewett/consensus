import { ElectionService, ElectionCreationDTO } from "./ElectionService";
import { IElectionRepository } from "../repositories/interfaces/IElectionRepository";
import { ICandidateRepository } from "../repositories/interfaces/ICandidateRepository";
import { Election } from "../domain/entities/Election";
import { Candidate } from "../domain/entities/Candidate";
import { ElectionType, ElectionStatus } from "../domain/enums";

// Mock Repositories
class MockElectionRepository implements IElectionRepository {
    private elections: Map<string, Election> = new Map();
    save(election: Election): void {
        this.elections.set(election.electionID, election);
    }
    findById(electionID: string): Election | null {
        return this.elections.get(electionID) || null;
    }
    findAll(): Election[] {
        return Array.from(this.elections.values());
    }
    findActive(): Election[] {
        return Array.from(this.elections.values()).filter((e) => e.status === ElectionStatus.ACTIVE);
    }
    findByStatus(status: ElectionStatus): Election[] {
        return Array.from(this.elections.values()).filter((e) => e.status === status);
    }
    update(election: Election): void {
        this.elections.set(election.electionID, election);
    }
    delete(electionID: string): void {
        this.elections.delete(electionID);
    }
}

class MockCandidateRepository implements ICandidateRepository {
    private candidates: Map<string, Candidate> = new Map();
    save(candidate: Candidate): void {
        this.candidates.set(candidate.candidateID, candidate);
    }
    findById(candidateID: string): Candidate | null {
        return this.candidates.get(candidateID) || null;
    }
    findByElectionId(electionID: string): Candidate[] {
        return Array.from(this.candidates.values()).filter((c) => c.electionID === electionID);
    }
    update(candidate: Candidate): void {
        this.candidates.set(candidate.candidateID, candidate);
    }
    delete(candidateID: string): void {
        this.candidates.delete(candidateID);
    }
}

describe("ElectionService", () => {
    let service: ElectionService;
    let electionRepo: MockElectionRepository;
    let candidateRepo: MockCandidateRepository;

    const createFutureDates = () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        return { startDate, endDate };
    };

    beforeEach(() => {
        electionRepo = new MockElectionRepository();
        candidateRepo = new MockCandidateRepository();
        service = new ElectionService(electionRepo, candidateRepo);
    });

    describe("Election Creation", () => {
        it("should create a new election with DRAFT status", () => {
            const { startDate, endDate } = createFutureDates();
            const dto: ElectionCreationDTO = {
                name: "Test Election",
                electionType: ElectionType.FPTP,
                startDate,
                endDate,
                description: "A test election",
            };

            const election = service.createElection(dto);

            expect(election.name).toBe("Test Election");
            expect(election.status).toBe(ElectionStatus.DRAFT);
        });

        it("should reject election with end date before start date", () => {
            const { startDate, endDate } = createFutureDates();
            expect(() =>
                service.createElection({
                    name: "Invalid",
                    electionType: ElectionType.FPTP,
                    startDate: endDate,
                    endDate: startDate,
                    description: "Invalid",
                })
            ).toThrow("End date must be after start date");
        });

        it("should reject election with start date in the past", () => {
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            expect(() =>
                service.createElection({
                    name: "Past",
                    electionType: ElectionType.FPTP,
                    startDate: pastDate,
                    endDate: new Date(Date.now() + 86400000),
                    description: "Past",
                })
            ).toThrow("Start date cannot be in the past");
        });
    });

    describe("Candidate Management", () => {
        let election: Election;

        beforeEach(() => {
            const { startDate, endDate } = createFutureDates();
            election = service.createElection({
                name: "Candidate Test",
                electionType: ElectionType.FPTP,
                startDate,
                endDate,
                description: "Test",
            });
        });

        it("should add candidate to draft election", () => {
            const candidate = service.addCandidate(election.electionID, {
                name: "John Smith",
                party: "Independent",
                biography: "Bio",
            });

            expect(candidate.name).toBe("John Smith");
            expect(candidate.electionID).toBe(election.electionID);
        });

        it("should throw error when adding candidate to non-existent election", () => {
            expect(() =>
                service.addCandidate("non-existent", { name: "Test", party: "Test", biography: "Test" })
            ).toThrow("Election not found");
        });

        it("should throw error when adding candidate to active election", () => {
            service.addCandidate(election.electionID, { name: "C1", party: "P1", biography: "B1" });
            service.addCandidate(election.electionID, { name: "C2", party: "P2", biography: "B2" });
            service.activateElection(election.electionID);

            expect(() =>
                service.addCandidate(election.electionID, { name: "Late", party: "Late", biography: "Late" })
            ).toThrow("Cannot add candidates to non-draft elections");
        });
    });

    describe("Election Lifecycle", () => {
        let election: Election;

        beforeEach(() => {
            const { startDate, endDate } = createFutureDates();
            election = service.createElection({
                name: "Lifecycle Test",
                electionType: ElectionType.FPTP,
                startDate,
                endDate,
                description: "Test",
            });
            service.addCandidate(election.electionID, { name: "C1", party: "P1", biography: "B1" });
            service.addCandidate(election.electionID, { name: "C2", party: "P2", biography: "B2" });
        });

        it("should activate a draft election with sufficient candidates", () => {
            service.activateElection(election.electionID);
            expect(service.getElectionById(election.electionID)?.status).toBe(ElectionStatus.ACTIVE);
        });

        it("should throw error when activating election with insufficient candidates", () => {
            const { startDate, endDate } = createFutureDates();
            const emptyElection = service.createElection({
                name: "Empty",
                electionType: ElectionType.FPTP,
                startDate,
                endDate,
                description: "No candidates",
            });

            expect(() => service.activateElection(emptyElection.electionID)).toThrow(
                "Election must have at least 2 candidates"
            );
        });

        it("should close an active election", () => {
            service.activateElection(election.electionID);
            service.closeElection(election.electionID);
            expect(service.getElectionById(election.electionID)?.status).toBe(ElectionStatus.CLOSED);
        });
    });
});
