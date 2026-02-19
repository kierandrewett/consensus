import { Ballot } from "./Ballot";

describe("Ballot Entity", () => {
    describe("Construction", () => {
        it("should create a ballot with all required properties", () => {
            const ballot = new Ballot("ballot-123", "election-456", ["candidate-1"]);

            expect(ballot.ballotID).toBe("ballot-123");
            expect(ballot.electionID).toBe("election-456");
            expect(ballot.preferences).toEqual(["candidate-1"]);
        });

        it("should create FPTP ballot with single preference", () => {
            const ballot = new Ballot("fptp-ballot", "election-1", ["candidate-A"]);
            expect(ballot.preferences).toHaveLength(1);
        });

        it("should create preferential ballot with multiple preferences", () => {
            const ballot = new Ballot("pref-ballot", "election-2", ["candidate-A", "candidate-B", "candidate-C"]);
            expect(ballot.preferences).toHaveLength(3);
            expect(ballot.preferences).toEqual(["candidate-A", "candidate-B", "candidate-C"]);
        });
    });

    describe("Privacy Compliance", () => {
        it("should NOT contain any voter identifying information", () => {
            const ballot = new Ballot("ballot-privacy", "election-1", ["candidate-1"]);

            expect(ballot).toHaveProperty("ballotID");
            expect(ballot).toHaveProperty("electionID");
            expect(ballot).toHaveProperty("preferences");
            expect(ballot).not.toHaveProperty("voterID");
            expect(ballot).not.toHaveProperty("voter");
        });
    });

    describe("isFor() method", () => {
        it("should return true when ballot is for specified candidate", () => {
            const ballot = new Ballot("b1", "e1", ["candidate-A"]);
            expect(ballot.isFor("candidate-A")).toBe(true);
        });

        it("should return false when ballot is not for specified candidate", () => {
            const ballot = new Ballot("b2", "e1", ["candidate-A"]);
            expect(ballot.isFor("candidate-B")).toBe(false);
        });

        it("should return true for any candidate in preferences list", () => {
            const ballot = new Ballot("b3", "e1", ["candidate-A", "candidate-B", "candidate-C"]);
            expect(ballot.isFor("candidate-A")).toBe(true);
            expect(ballot.isFor("candidate-B")).toBe(true);
            expect(ballot.isFor("candidate-C")).toBe(true);
            expect(ballot.isFor("candidate-D")).toBe(false);
        });
    });

    describe("getPreferenceRank() method", () => {
        it("should return 1 for first preference", () => {
            const ballot = new Ballot("rank-ballot", "e1", ["candidate-A", "candidate-B", "candidate-C"]);
            expect(ballot.getPreferenceRank("candidate-A")).toBe(1);
        });

        it("should return correct rank for each preference", () => {
            const ballot = new Ballot("rank-ballot-2", "e1", ["candidate-A", "candidate-B", "candidate-C"]);
            expect(ballot.getPreferenceRank("candidate-A")).toBe(1);
            expect(ballot.getPreferenceRank("candidate-B")).toBe(2);
            expect(ballot.getPreferenceRank("candidate-C")).toBe(3);
        });

        it("should return null for candidate not in preferences", () => {
            const ballot = new Ballot("rank-ballot-3", "e1", ["candidate-A", "candidate-B"]);
            expect(ballot.getPreferenceRank("candidate-Z")).toBeNull();
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty preferences array", () => {
            const ballot = new Ballot("empty-ballot", "e1", []);
            expect(ballot.preferences).toHaveLength(0);
            expect(ballot.isFor("candidate-A")).toBe(false);
            expect(ballot.getPreferenceRank("candidate-A")).toBeNull();
        });
    });
});
