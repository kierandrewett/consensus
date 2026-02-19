import { Voter } from "../domain/entities/Voter";
import { VoteConfirmation } from "../domain/entities/VoteConfirmation";
import { RegistrationStatus, ElectionStatus } from "../domain/enums";
import { IBallotRepository } from "../repositories/interfaces/IBallotRepository";
import { IVoterEligibilityRepository } from "../repositories/interfaces/IVoterEligibilityRepository";
import { IVoteConfirmationRepository } from "../repositories/VoteConfirmationRepository";
import { IElectionRepository } from "../repositories/interfaces/IElectionRepository";
import { ICandidateRepository } from "../repositories/interfaces/ICandidateRepository";
import { BallotFactory } from "./factories/BallotFactory";
import { AnonymousBallotAdapter, VoteInput } from "./adapters/AnonymousBallotAdapter";
import { IVotingStrategy, VoteResult } from "./strategies/IVotingStrategy";
import { FPTPStrategy } from "./strategies/FPTPStrategy";
import { STVStrategy } from "./strategies/STVStrategy";
import { AVStrategy } from "./strategies/AVStrategy";
import { ElectionType } from "../domain/enums";

export interface CastVoteDTO {
    voterID: string;
    electionID: string;
    candidateID?: string;
    preferences?: string[];
}

export class VotingService {
    private anonymousAdapter: AnonymousBallotAdapter;
    private strategyMap: Map<ElectionType, IVotingStrategy>;

    constructor(
        private ballotRepository: IBallotRepository,
        private eligibilityRepository: IVoterEligibilityRepository,
        private confirmationRepository: IVoteConfirmationRepository,
        private electionRepository: IElectionRepository,
        private candidateRepository: ICandidateRepository
    ) {
        this.anonymousAdapter = new AnonymousBallotAdapter();
        this.strategyMap = new Map();
        this.strategyMap.set(ElectionType.FPTP, new FPTPStrategy());
        this.strategyMap.set(ElectionType.STV, new STVStrategy());
        this.strategyMap.set(ElectionType.AV, new AVStrategy());
        this.strategyMap.set(ElectionType.PREFERENTIAL, new STVStrategy());
    }

    /**
     * Cast a vote
     * @param voter The voter casting the vote
     * @param dto Vote data
     * @returns Confirmation receipt
     */
    castVote(voter: Voter, dto: CastVoteDTO): VoteConfirmation {
        // Validate voter is approved
        if (voter.registrationStatus !== RegistrationStatus.APPROVED) {
            throw new Error("Voter is not approved");
        }

        // Get election
        const election = this.electionRepository.findById(dto.electionID);
        if (!election) {
            throw new Error("Election not found");
        }

        // Validate election is active
        if (election.status !== ElectionStatus.ACTIVE) {
            throw new Error("Election is not active");
        }

        // Check election dates
        const now = new Date();
        if (now < election.startDate || now > election.endDate) {
            throw new Error("Election is not currently open for voting");
        }

        // Check voter hasn't already voted
        if (this.eligibilityRepository.hasVoted(dto.voterID, dto.electionID)) {
            throw new Error("Voter has already voted in this election");
        }

        // Validate candidate(s) exist in this election
        const candidates = this.candidateRepository.findByElectionId(dto.electionID);
        const candidateIDs = new Set(candidates.map((c) => c.candidateID));

        if (dto.candidateID && !candidateIDs.has(dto.candidateID)) {
            throw new Error("Invalid candidate ID");
        }

        if (dto.preferences) {
            for (const prefID of dto.preferences) {
                if (!candidateIDs.has(prefID)) {
                    throw new Error(`Invalid candidate ID in preferences: ${prefID}`);
                }
            }
        }

        const ballot = BallotFactory.createBallot(
            election.electionType,
            dto.electionID,
            dto.candidateID,
            dto.preferences
        );

        const strategy = this.strategyMap.get(election.electionType);
        if (!strategy) {
            throw new Error(`No voting strategy for election type: ${election.electionType}`);
        }

        if (!strategy.validateBallot(ballot, candidates.length)) {
            throw new Error("Invalid ballot: Please ensure each candidate has a unique ranking with no duplicates.");
        }

        const voteInput: VoteInput = {
            voter,
            electionID: dto.electionID,
            candidateID: dto.candidateID,
            preferences: dto.preferences,
        };

        const { ballot: anonymousBallot, confirmation } = this.anonymousAdapter.adapt(voteInput);

        // Verify ballot is truly anonymous
        if (!this.anonymousAdapter.verifyAnonymity(anonymousBallot)) {
            throw new Error("Ballot anonymity verification failed");
        }

        // Store anonymous ballot (no link to voter)
        this.ballotRepository.save(anonymousBallot);

        // Store confirmation (for voter's records, no vote details)
        this.confirmationRepository.save(confirmation);

        // Mark voter as having voted
        this.eligibilityRepository.markVoted(dto.voterID, dto.electionID);

        // Return confirmation
        return confirmation;
    }

    /**
     * Get voter's vote confirmations
     * @param voterID The voter ID
     * @returns List of confirmations (no vote details)
     */
    getVoterConfirmations(voterID: string): VoteConfirmation[] {
        return this.confirmationRepository.findByVoterId(voterID);
    }

    /**
     * Check if voter has voted in an election
     */
    hasVoted(voterID: string, electionID: string): boolean {
        return this.eligibilityRepository.hasVoted(voterID, electionID);
    }

    /**
     * Calculate election results using appropriate voting strategy
     * @param electionID The election ID
     * @returns Vote results
     */
    calculateResults(electionID: string): VoteResult[] {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error("Election not found");
        }

        // Election must be closed to view results
        if (election.status !== ElectionStatus.CLOSED) {
            throw new Error("Results only available for closed elections");
        }

        // Get ballots and candidates
        const ballots = this.ballotRepository.findByElectionId(electionID);
        const candidates = this.candidateRepository.findByElectionId(electionID);

        const strategy = this.strategyMap.get(election.electionType);
        if (!strategy) {
            throw new Error(`No voting strategy for election type: ${election.electionType}`);
        }

        return strategy.calculateResults(ballots, candidates);
    }

    /**
     * Get total vote count for an election
     */
    getVoteCount(electionID: string): number {
        return this.ballotRepository.countByElectionId(electionID);
    }
}
