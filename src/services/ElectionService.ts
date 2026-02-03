import { randomUUID } from 'crypto';
import { Election } from '../domain/entities/Election';
import { Candidate } from '../domain/entities/Candidate';
import { ElectionType, ElectionStatus } from '../domain/enums';
import { IElectionRepository } from '../repositories/interfaces/IElectionRepository';
import { ICandidateRepository } from '../repositories/interfaces/ICandidateRepository';

export interface ElectionCreationDTO {
    name: string;
    electionType: ElectionType;
    startDate: Date;
    endDate: Date;
    description: string;
}

export interface CandidateCreationDTO {
    name: string;
    party: string;
    biography: string;
}

export class ElectionService {
    constructor(
        private electionRepository: IElectionRepository,
        private candidateRepository: ICandidateRepository
    ) {}

    /**
     * Create a new election
     */
    createElection(dto: ElectionCreationDTO): Election {
        // Validate dates
        if (dto.startDate >= dto.endDate) {
            throw new Error('End date must be after start date');
        }

        // Allow any time on current date (compare dates only, not times)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(dto.startDate);
        startDay.setHours(0, 0, 0, 0);
        
        if (startDay < today) {
            throw new Error('Start date cannot be in the past');
        }

        const election = new Election(
            randomUUID(),
            dto.name,
            dto.electionType,
            dto.startDate,
            dto.endDate,
            dto.description,
            ElectionStatus.DRAFT
        );

        this.electionRepository.save(election);

        return election;
    }

    /**
     * Add a candidate to an election
     */
    addCandidate(electionID: string, dto: CandidateCreationDTO): Candidate {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error('Election not found');
        }

        if (election.status !== ElectionStatus.DRAFT) {
            throw new Error('Cannot add candidates to non-draft elections');
        }

        const candidate = new Candidate(
            randomUUID(),
            electionID,
            dto.name,
            dto.party,
            dto.biography
        );

        this.candidateRepository.save(candidate);

        return candidate;
    }

    /**
     * Remove a candidate from an election
     */
    removeCandidate(electionID: string, candidateID: string): void {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error('Election not found');
        }

        if (election.status !== ElectionStatus.DRAFT) {
            throw new Error('Cannot remove candidates from non-draft elections');
        }

        const candidate = this.candidateRepository.findById(candidateID);
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        if (candidate.electionID !== electionID) {
            throw new Error('Candidate does not belong to this election');
        }

        this.candidateRepository.delete(candidateID);
    }

    /**
     * Get election by ID
     */
    getElectionById(electionID: string): Election | null {
        return this.electionRepository.findById(electionID);
    }

    /**
     * Get candidates for an election
     */
    getCandidates(electionID: string): Candidate[] {
        return this.candidateRepository.findByElectionId(electionID);
    }

    /**
     * Get all active elections
     */
    getActiveElections(): Election[] {
        return this.electionRepository.findActive();
    }

    /**
     * Get all elections
     */
    getAllElections(): Election[] {
        return this.electionRepository.findAll();
    }

    /**
     * Get all closed elections
     */
    getClosedElections(): Election[] {
        return this.electionRepository.findAll().filter(
            election => election.status === ElectionStatus.CLOSED
        );
    }

    /**
     * Activate an election (make it available for voting)
     */
    activateElection(electionID: string): void {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error('Election not found');
        }

        // Validate election has candidates
        const candidates = this.candidateRepository.findByElectionId(electionID);
        if (candidates.length < 2) {
            throw new Error('Election must have at least 2 candidates');
        }

        election.status = ElectionStatus.ACTIVE;
        this.electionRepository.update(election);
    }

    /**
     * Close an election (no more votes accepted)
     */
    closeElection(electionID: string): void {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error('Election not found');
        }

        election.status = ElectionStatus.CLOSED;
        this.electionRepository.update(election);
    }

    /**
     * Delete a draft election
     */
    deleteElection(electionID: string): void {
        const election = this.electionRepository.findById(electionID);
        if (!election) {
            throw new Error('Election not found');
        }

        if (election.status !== ElectionStatus.DRAFT) {
            throw new Error('Only draft elections can be deleted');
        }

        // Delete all candidates first
        const candidates = this.candidateRepository.findByElectionId(electionID);
        for (const candidate of candidates) {
            this.candidateRepository.delete(candidate.candidateID);
        }

        this.electionRepository.delete(electionID);
    }
}
