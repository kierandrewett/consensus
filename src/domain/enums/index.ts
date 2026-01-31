export enum ElectionType {
    FPTP = 'FPTP',              // First Past The Post
    STV = 'STV',                // Single Transferable Vote
    AV = 'AV',                  // Alternative Vote
    PREFERENTIAL = 'PREFERENTIAL' // Preferential Voting
}

export enum ElectionStatus {
    DRAFT = 'DRAFT',      // Election being set up
    ACTIVE = 'ACTIVE',    // Currently accepting votes
    CLOSED = 'CLOSED'     // Voting ended, results available
}

export enum RegistrationStatus {
    PENDING = 'PENDING',      // Awaiting approval
    APPROVED = 'APPROVED',    // Can vote
    REJECTED = 'REJECTED',    // Registration denied
    SUSPENDED = 'SUSPENDED'   // Temporarily disabled
}
