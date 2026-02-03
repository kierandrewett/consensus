import { randomUUID } from 'crypto';
import { Voter } from '../domain/entities/Voter';
import { RegistrationStatus } from '../domain/enums';
import { IVoterRepository } from '../repositories/interfaces/IVoterRepository';

export interface VoterRegistrationDTO {
    name: string;
    email: string;
    password: string;
}

export class VoterService {
    constructor(private voterRepository: IVoterRepository) {}

    /**
     * Register a new voter
     * @param dto Registration data
     * @param autoApprove Whether to automatically approve the voter
     * @returns The newly created voter
     */
    registerVoter(dto: VoterRegistrationDTO, autoApprove: boolean = false): Voter {
        // Check if email already exists
        const existingVoter = this.voterRepository.findByEmail(dto.email);
        if (existingVoter) {
            throw new Error('Email already registered');
        }

        // Validate email format
        if (!this.isValidEmail(dto.email)) {
            throw new Error('Invalid email format');
        }

        // Validate password strength
        if (dto.password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        // Create voter with PENDING or APPROVED status based on autoApprove
        const voter = new Voter(
            randomUUID(),
            dto.name,
            dto.email,
            dto.password, // In production, would be hashed
            autoApprove ? RegistrationStatus.APPROVED : RegistrationStatus.PENDING,
            new Date()
        );

        this.voterRepository.save(voter);

        return voter;
    }

    /**
     * Get voter by ID
     */
    getVoterById(voterID: string): Voter | null {
        return this.voterRepository.findById(voterID);
    }

    /**
     * Get voter by email (for login)
     */
    getVoterByEmail(email: string): Voter | null {
        return this.voterRepository.findByEmail(email);
    }

    /**
     * Approve voter registration
     */
    approveVoter(voterID: string): void {
        const voter = this.voterRepository.findById(voterID);
        if (!voter) {
            throw new Error('Voter not found');
        }

        voter.registrationStatus = RegistrationStatus.APPROVED;
        this.voterRepository.update(voter);
    }

    /**
     * Reject voter registration
     */
    rejectVoter(voterID: string): void {
        const voter = this.voterRepository.findById(voterID);
        if (!voter) {
            throw new Error('Voter not found');
        }

        voter.registrationStatus = RegistrationStatus.REJECTED;
        this.voterRepository.update(voter);
    }

    /**
     * List all voters
     */
    getAllVoters(): Voter[] {
        return this.voterRepository.findAll();
    }

    /**
     * Update voter profile
     */
    updateVoter(voterID: string, updates: { name?: string; email?: string; passwordHash?: string }): Voter {
        const voter = this.voterRepository.findById(voterID);
        if (!voter) {
            throw new Error('Voter not found');
        }

        // Check if email is being changed and if new email already exists
        if (updates.email && updates.email !== voter.email) {
            const existingVoter = this.voterRepository.findByEmail(updates.email);
            if (existingVoter) {
                throw new Error('Email already registered');
            }
            if (!this.isValidEmail(updates.email)) {
                throw new Error('Invalid email format');
            }
            voter.email = updates.email;
        }

        if (updates.name) {
            voter.name = updates.name;
        }

        if (updates.passwordHash) {
            voter.passwordHash = updates.passwordHash;
        }

        this.voterRepository.update(voter);
        return voter;
    }

    /**
     * Delete voter account (GDPR)
     */
    deleteVoter(voterID: string): void {
        const voter = this.voterRepository.findById(voterID);
        if (!voter) {
            throw new Error('Voter not found');
        }
        this.voterRepository.delete(voterID);
    }

    /**
     * Validate email format
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
