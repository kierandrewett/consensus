export const ElectionTypeLabels: Record<string, { full: string; description: string }> = {
    FPTP: {
        full: "First Past The Post",
        description: "Winner takes all - candidate with most votes wins",
    },
    STV: {
        full: "Single Transferable Vote",
        description: "Proportional representation using ranked preferences",
    },
    AV: {
        full: "Alternative Vote",
        description: "Ranked choice with instant runoff",
    },
    PREFERENTIAL: {
        full: "Preferential Voting",
        description: "Voters rank candidates in order of preference",
    },
};

export function getElectionTypeLabel(type: string): string {
    return ElectionTypeLabels[type]?.full || type;
}

export function getElectionTypeDescription(type: string): string {
    return ElectionTypeLabels[type]?.description || "";
}
