import { FPTPStrategy } from "./FPTPStrategy";
import { STVStrategy } from "./STVStrategy";
import { AVStrategy } from "./AVStrategy";
import { Ballot } from "../../domain/entities/Ballot";
import { Candidate } from "../../domain/entities/Candidate";

describe("Voting Strategies (Strategy Pattern)", () => {
    // Helpers
    const createCandidates = (count: number, electionID: string = "e1"): Candidate[] => {
        return Array.from(
            { length: count },
            (_, i) =>
                new Candidate(
                    `candidate-${String.fromCharCode(65 + i)}`,
                    electionID,
                    `Candidate ${String.fromCharCode(65 + i)}`,
                    "Party",
                    "Bio"
                )
        );
    };

    const createFPTPBallot = (candidateID: string, electionID: string = "e1"): Ballot => {
        return new Ballot(`b-${Math.random()}`, electionID, [candidateID]);
    };

    const createPreferentialBallot = (preferences: string[], electionID: string = "e1"): Ballot => {
        return new Ballot(`b-${Math.random()}`, electionID, preferences);
    };

    describe("FPTPStrategy", () => {
        let strategy: FPTPStrategy;

        beforeEach(() => {
            strategy = new FPTPStrategy();
        });

        describe("calculateResults()", () => {
            it("should correctly count votes for each candidate", () => {
                const candidates = createCandidates(3);
                const ballots = [
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-C"),
                ];

                const results = strategy.calculateResults(ballots, candidates);

                expect(results[0].candidateID).toBe("candidate-A");
                expect(results[0].votes).toBe(3);
                expect(results[1].candidateID).toBe("candidate-B");
                expect(results[1].votes).toBe(2);
                expect(results[2].candidateID).toBe("candidate-C");
                expect(results[2].votes).toBe(1);
            });

            it("should calculate correct percentages", () => {
                const candidates = createCandidates(2);
                const ballots = [
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-B"),
                ];

                const results = strategy.calculateResults(ballots, candidates);

                expect(results[0].percentage).toBe(75);
                expect(results[1].percentage).toBe(25);
            });

            it("should mark winner with isWinner flag", () => {
                const candidates = createCandidates(3);
                const ballots = [
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-C"),
                ];

                const results = strategy.calculateResults(ballots, candidates);
                const winner = results.find((r) => r.isWinner);

                expect(winner?.candidateID).toBe("candidate-B");
            });

            it("should handle empty ballots array", () => {
                const candidates = createCandidates(2);
                const results = strategy.calculateResults([], candidates);

                expect(results).toHaveLength(2);
                expect(results[0].votes).toBe(0);
                expect(results[0].percentage).toBe(0);
            });
        });

        describe("Tie Detection", () => {
            it("should detect tie when top candidates have equal votes", () => {
                const candidates = createCandidates(3);
                const ballots = [
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-A"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-B"),
                    createFPTPBallot("candidate-C"),
                ];

                const results = strategy.calculateResults(ballots, candidates);
                const tiedCandidates = results.filter((r) => r.isTied);

                expect(tiedCandidates).toHaveLength(2);
                expect(tiedCandidates.map((r) => r.candidateID)).toContain("candidate-A");
                expect(tiedCandidates.map((r) => r.candidateID)).toContain("candidate-B");
            });

            it("should not mark isWinner when there is a tie", () => {
                const candidates = createCandidates(2);
                const ballots = [createFPTPBallot("candidate-A"), createFPTPBallot("candidate-B")];

                const results = strategy.calculateResults(ballots, candidates);

                expect(results.filter((r) => r.isWinner)).toHaveLength(0);
                expect(results.filter((r) => r.isTied)).toHaveLength(2);
            });
        });

        describe("validateBallot()", () => {
            it("should return true for valid FPTP ballot", () => {
                const ballot = createFPTPBallot("candidate-A");
                expect(strategy.validateBallot(ballot, 3)).toBe(true);
            });

            it("should return false for ballot with multiple preferences", () => {
                const ballot = createPreferentialBallot(["candidate-A", "candidate-B"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(false);
            });

            it("should return false for empty preferences", () => {
                const ballot = new Ballot("b1", "e1", []);
                expect(strategy.validateBallot(ballot, 3)).toBe(false);
            });
        });
    });

    describe("STVStrategy", () => {
        let strategy: STVStrategy;

        beforeEach(() => {
            strategy = new STVStrategy();
        });

        describe("calculateResults()", () => {
            it("should count first preferences initially", () => {
                const candidates = createCandidates(3);
                const ballots = [
                    createPreferentialBallot(["candidate-A", "candidate-B", "candidate-C"]),
                    createPreferentialBallot(["candidate-A", "candidate-C", "candidate-B"]),
                    createPreferentialBallot(["candidate-B", "candidate-A", "candidate-C"]),
                ];

                const results = strategy.calculateResults(ballots, candidates);
                expect(results.find((r) => r.candidateID === "candidate-A")?.votes).toBeGreaterThanOrEqual(2);
            });

            it("should return results for all candidates", () => {
                const candidates = createCandidates(2);
                const ballots = [
                    createPreferentialBallot(["candidate-A"]),
                    createPreferentialBallot(["candidate-A"]),
                    createPreferentialBallot(["candidate-B"]),
                    createPreferentialBallot(["candidate-B"]),
                ];

                const results = strategy.calculateResults(ballots, candidates);
                // Should return results for both candidates
                expect(results).toHaveLength(2);
            });
        });

        describe("validateBallot()", () => {
            it("should return true for valid preferential ballot", () => {
                const ballot = createPreferentialBallot(["candidate-A", "candidate-B"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(true);
            });

            it("should return false for duplicate preferences", () => {
                const ballot = createPreferentialBallot(["candidate-A", "candidate-A"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(false);
            });

            it("should accept partial rankings", () => {
                const ballot = createPreferentialBallot(["candidate-A"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(true);
            });
        });
    });

    describe("AVStrategy", () => {
        let strategy: AVStrategy;

        beforeEach(() => {
            strategy = new AVStrategy();
        });

        describe("calculateResults()", () => {
            it("should declare winner if they have majority", () => {
                const candidates = createCandidates(3);
                const ballots = [
                    createPreferentialBallot(["candidate-A", "candidate-B"]),
                    createPreferentialBallot(["candidate-A", "candidate-C"]),
                    createPreferentialBallot(["candidate-A", "candidate-B"]),
                    createPreferentialBallot(["candidate-B", "candidate-A"]),
                ];

                const results = strategy.calculateResults(ballots, candidates);
                const winner = results.find((r) => r.isWinner);

                expect(winner).toBeDefined();
                expect(winner?.candidateID).toBe("candidate-A");
            });
        });

        describe("validateBallot()", () => {
            it("should return true for valid preferential ballot", () => {
                const ballot = createPreferentialBallot(["candidate-A", "candidate-B"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(true);
            });

            it("should return false for empty preferences", () => {
                const ballot = new Ballot("b1", "e1", []);
                expect(strategy.validateBallot(ballot, 3)).toBe(false);
            });

            it("should return false for duplicate preferences", () => {
                const ballot = createPreferentialBallot(["candidate-A", "candidate-A"]);
                expect(strategy.validateBallot(ballot, 3)).toBe(false);
            });
        });
    });
});
