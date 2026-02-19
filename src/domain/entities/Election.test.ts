import { Election } from "./Election";
import { ElectionType, ElectionStatus } from "../enums";

describe("Election Entity", () => {
    const createTestElection = (status: ElectionStatus = ElectionStatus.DRAFT) => {
        return new Election(
            "election-123",
            "Test Election",
            ElectionType.FPTP,
            new Date("2024-01-01"),
            new Date("2024-12-31"),
            "Test election description",
            status
        );
    };

    describe("Construction", () => {
        it("should create an election with all required properties", () => {
            const election = new Election(
                "election-456",
                "Presidential Election",
                ElectionType.STV,
                new Date("2024-06-01"),
                new Date("2024-06-15"),
                "National presidential election"
            );

            expect(election.electionID).toBe("election-456");
            expect(election.name).toBe("Presidential Election");
            expect(election.electionType).toBe(ElectionType.STV);
        });

        it("should default status to DRAFT when not specified", () => {
            const election = new Election(
                "election-789",
                "Default Status",
                ElectionType.FPTP,
                new Date("2024-01-01"),
                new Date("2024-12-31"),
                "Test"
            );

            expect(election.status).toBe(ElectionStatus.DRAFT);
        });
    });

    describe("Election Types", () => {
        it.each([ElectionType.FPTP, ElectionType.STV, ElectionType.AV, ElectionType.PREFERENTIAL])(
            "should support %s election type",
            (type) => {
                const election = new Election("e1", "Test", type, new Date(), new Date(), "Test");
                expect(election.electionType).toBe(type);
            }
        );
    });

    describe("Status Management", () => {
        it("should allow status to be updated via setter", () => {
            const election = createTestElection(ElectionStatus.DRAFT);
            election.status = ElectionStatus.ACTIVE;
            expect(election.status).toBe(ElectionStatus.ACTIVE);
        });

        it.each([
            [ElectionStatus.DRAFT, ElectionStatus.ACTIVE],
            [ElectionStatus.ACTIVE, ElectionStatus.CLOSED],
            [ElectionStatus.DRAFT, ElectionStatus.CLOSED],
        ])("should allow transition from %s to %s", (from, to) => {
            const election = createTestElection(from);
            election.status = to;
            expect(election.status).toBe(to);
        });
    });

    describe("Name Validation", () => {
        it("should allow updating name with valid value", () => {
            const election = createTestElection();
            election.name = "Updated Election Name";
            expect(election.name).toBe("Updated Election Name");
        });

        it("should throw error when setting empty name", () => {
            const election = createTestElection();
            expect(() => {
                election.name = "";
            }).toThrow("Election name cannot be empty");
        });

        it("should throw error when setting whitespace-only name", () => {
            const election = createTestElection();
            expect(() => {
                election.name = "   ";
            }).toThrow("Election name cannot be empty");
        });
    });

    describe("isActive() method", () => {
        it("should return true when status is ACTIVE and within date range", () => {
            const election = new Election(
                "active-election",
                "Active",
                ElectionType.FPTP,
                new Date(Date.now() - 86400000), // Yesterday
                new Date(Date.now() + 86400000), // Tomorrow
                "Test",
                ElectionStatus.ACTIVE
            );

            expect(election.isActive()).toBe(true);
        });

        it("should return false when status is not ACTIVE", () => {
            const election = new Election(
                "draft-election",
                "Draft",
                ElectionType.FPTP,
                new Date(Date.now() - 86400000),
                new Date(Date.now() + 86400000),
                "Test",
                ElectionStatus.DRAFT
            );

            expect(election.isActive()).toBe(false);
        });
    });

    describe("isClosed() method", () => {
        it("should return true when status is CLOSED", () => {
            const election = createTestElection(ElectionStatus.CLOSED);
            expect(election.isClosed()).toBe(true);
        });

        it("should return false when status is not CLOSED", () => {
            const election = createTestElection(ElectionStatus.ACTIVE);
            expect(election.isClosed()).toBe(false);
        });
    });
});
