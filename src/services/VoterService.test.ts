import { VoterService, VoterRegistrationDTO } from "./VoterService";
import { IVoterRepository } from "../repositories/interfaces/IVoterRepository";
import { Voter } from "../domain/entities/Voter";
import { RegistrationStatus } from "../domain/enums";

// Mock Repository
class MockVoterRepository implements IVoterRepository {
    private voters: Map<string, Voter> = new Map();

    save(voter: Voter): void {
        this.voters.set(voter.voterID, voter);
    }
    findById(voterID: string): Voter | null {
        return this.voters.get(voterID) || null;
    }
    findByEmail(email: string): Voter | null {
        for (const voter of this.voters.values()) {
            if (voter.email === email) return voter;
        }
        return null;
    }
    update(voter: Voter): void {
        this.voters.set(voter.voterID, voter);
    }
    delete(voterID: string): void {
        this.voters.delete(voterID);
    }
    findAll(): Voter[] {
        return Array.from(this.voters.values());
    }
    clear(): void {
        this.voters.clear();
    }
}

describe("VoterService", () => {
    let service: VoterService;
    let repository: MockVoterRepository;

    beforeEach(() => {
        repository = new MockVoterRepository();
        service = new VoterService(repository);
    });

    describe("FR1: Voter Registration", () => {
        const validDTO: VoterRegistrationDTO = {
            name: "John Doe",
            email: "john@example.com",
            password: "securePassword123",
        };

        it("should register a new voter with PENDING status", () => {
            const voter = service.registerVoter(validDTO);

            expect(voter).toBeDefined();
            expect(voter.name).toBe("John Doe");
            expect(voter.email).toBe("john@example.com");
            expect(voter.registrationStatus).toBe(RegistrationStatus.PENDING);
        });

        it("should persist voter to repository", () => {
            const voter = service.registerVoter(validDTO);
            const retrieved = repository.findById(voter.voterID);
            expect(retrieved?.email).toBe("john@example.com");
        });

        it("should generate unique voter IDs", () => {
            const voter1 = service.registerVoter({ ...validDTO, email: "john1@example.com" });
            const voter2 = service.registerVoter({ ...validDTO, email: "john2@example.com" });
            expect(voter1.voterID).not.toBe(voter2.voterID);
        });

        it("should reject duplicate email registration", () => {
            service.registerVoter(validDTO);
            expect(() => service.registerVoter(validDTO)).toThrow("Email already registered");
        });

        it("should reject invalid email format", () => {
            expect(() => service.registerVoter({ ...validDTO, email: "invalid" })).toThrow("Invalid email format");
        });

        it("should reject weak passwords", () => {
            expect(() => service.registerVoter({ ...validDTO, password: "short" })).toThrow(
                "Password must be at least 8 characters"
            );
        });
    });

    describe("Voter Approval/Rejection", () => {
        let registeredVoter: Voter;

        beforeEach(() => {
            registeredVoter = service.registerVoter({
                name: "Jane",
                email: "jane@example.com",
                password: "password123",
            });
        });

        it("should approve pending voter", () => {
            service.approveVoter(registeredVoter.voterID);
            expect(service.getVoterById(registeredVoter.voterID)?.registrationStatus).toBe(RegistrationStatus.APPROVED);
        });

        it("should reject pending voter", () => {
            service.rejectVoter(registeredVoter.voterID);
            expect(service.getVoterById(registeredVoter.voterID)?.registrationStatus).toBe(RegistrationStatus.REJECTED);
        });

        it("should throw error when approving non-existent voter", () => {
            expect(() => service.approveVoter("non-existent")).toThrow("Voter not found");
        });

        it("should throw error when rejecting non-existent voter", () => {
            expect(() => service.rejectVoter("non-existent")).toThrow("Voter not found");
        });
    });

    describe("Voter Retrieval", () => {
        beforeEach(() => {
            service.registerVoter({ name: "Alice", email: "alice@example.com", password: "password123" });
            service.registerVoter({ name: "Bob", email: "bob@example.com", password: "password123" });
        });

        it("should find voter by email", () => {
            const voter = service.getVoterByEmail("bob@example.com");
            expect(voter?.name).toBe("Bob");
        });

        it("should return null for non-existent email", () => {
            expect(service.getVoterByEmail("nonexistent@example.com")).toBeNull();
        });

        it("should get all voters", () => {
            const voters = service.getAllVoters();
            expect(voters).toHaveLength(2);
        });
    });
});
