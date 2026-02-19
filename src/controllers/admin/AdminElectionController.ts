import { FastifyRequest, FastifyReply } from "fastify";
import { ElectionService, ElectionCreationDTO } from "../../services/ElectionService";
import { VotingService } from "../../services/VotingService";
import { TieResolutionRepository, TieResolution } from "../../repositories/TieResolutionRepository";
import { ElectionType } from "../../domain/enums";
import { v4 as uuidv4 } from "uuid";
import { randomInt } from "crypto";

export interface ElectionCreationRequest {
    name: string;
    electionType: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface CandidateCreationRequest {
    name: string;
    party: string;
    biography: string;
}

export class AdminElectionController {
    constructor(
        private electionService: ElectionService,
        private votingService: VotingService,
        private tieResolutionRepository: TieResolutionRepository
    ) {}

    /**
     * Helper to redirect to login with return URL
     */
    private redirectToLogin(request: FastifyRequest, reply: FastifyReply): void {
        const returnUrl = encodeURIComponent(request.url);
        reply.redirect(`/admin/login?to=${returnUrl}`);
    }

    /**
     * Show elections management page
     */
    async showElections(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const elections = this.electionService.getAllElections();

        return reply.view("admin/elections.ejs", {
            title: "Manage Elections",
            elections,
        });
    }

    /**
     * Show single election details
     */
    async showElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const election = this.electionService.getElectionById(request.params.id);
        if (!election) {
            return reply.status(404).send("Election not found");
        }

        const voteCount = this.votingService.getVoteCount(election.electionID);
        const candidates = this.electionService.getCandidates(election.electionID);

        let results = null;
        let tieResolution = null;
        let hasTie = false;

        if (election.status === "CLOSED") {
            results = this.votingService.calculateResults(election.electionID);
            tieResolution = this.tieResolutionRepository.findByElectionId(election.electionID);
            hasTie = results.some((r) => r.isTied);
        }

        return reply.view("admin/election-detail.ejs", {
            title: `Election: ${election.name}`,
            election,
            candidates,
            voteCount,
            results,
            tieResolution,
            hasTie,
        });
    }

    /**
     * Show results page
     */
    async showResults(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return this.redirectToLogin(request, reply);
        }

        const elections = this.electionService.getAllElections();

        const enrichedElections = elections.map((election) => {
            const voteCount = this.votingService.getVoteCount(election.electionID);
            let winner = null;
            let results = null;
            let hasTie = false;
            let resolutionType: string | null = null;

            if (election.status === "CLOSED") {
                results = this.votingService.calculateResults(election.electionID);
                const tieResolution = this.tieResolutionRepository.findByElectionId(election.electionID);

                if (tieResolution) {
                    resolutionType = tieResolution.resolutionType;
                    if (tieResolution.winnerCandidateID) {
                        winner = results.find((r: any) => r.candidateID === tieResolution.winnerCandidateID);
                    }
                }

                if (!winner && results.length > 0) {
                    const clearWinner = results.find((r: any) => r.isWinner && !r.isTied);
                    if (clearWinner) {
                        winner = clearWinner;
                    } else {
                        hasTie = results.some((r: any) => r.isTied);
                    }
                }
            }

            return {
                electionID: election.electionID,
                name: election.name,
                description: election.description,
                electionType: election.electionType,
                status: election.status,
                startDate: election.startDate,
                endDate: election.endDate,
                voteCount,
                winner,
                hasTie,
                resolutionType,
                topResults: results ? results.slice(0, 3) : null,
            };
        });

        return reply.view("admin/results.ejs", {
            title: "Election Results",
            elections: enrichedElections,
        });
    }

    /**
     * Create a new election
     */
    async createElection(
        request: FastifyRequest<{ Body: ElectionCreationRequest }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { name, electionType, startDate, endDate, description } = request.body;

        try {
            const validTypes = Object.values(ElectionType);
            if (!validTypes.includes(electionType as ElectionType)) {
                throw new Error(`Invalid election type. Must be one of: ${validTypes.join(", ")}`);
            }

            const dto: ElectionCreationDTO = {
                name,
                electionType: electionType as ElectionType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                description,
            };

            const election = this.electionService.createElection(dto);

            return reply.redirect(`/admin/elections/${election.electionID}`);
        } catch (error: any) {
            return reply.status(400).view("admin/elections.ejs", {
                title: "Manage Elections",
                elections: this.electionService.getAllElections(),
                error: error.message,
            });
        }
    }

    /**
     * Close election early
     */
    async closeElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        try {
            this.electionService.closeElection(request.params.id);
            return reply.redirect(`/admin/elections/${request.params.id}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Delete election
     */
    async deleteElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        try {
            this.electionService.deleteElection(request.params.id);
            return reply.redirect("/admin/elections");
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Activate election
     */
    async activateElection(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        try {
            this.electionService.activateElection(request.params.id);
            return reply.redirect(`/admin/elections/${request.params.id}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Add candidate to election
     */
    async addCandidate(
        request: FastifyRequest<{
            Params: { id: string };
            Body: CandidateCreationRequest;
        }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const electionID = request.params.id;
        const { name, party, biography } = request.body;

        try {
            this.electionService.addCandidate(electionID, { name, party, biography });
            return reply.redirect(`/admin/elections/${electionID}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Remove candidate from election
     */
    async removeCandidate(
        request: FastifyRequest<{
            Params: { electionId: string; candidateId: string };
        }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const { electionId, candidateId } = request.params;

        try {
            this.electionService.removeCandidate(electionId, candidateId);
            return reply.redirect(`/admin/elections/${electionId}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }

    /**
     * Resolve tie in an election
     */
    async resolveTie(
        request: FastifyRequest<{
            Params: { id: string };
            Body: {
                resolutionType: "RANDOM" | "MANUAL" | "RECALL";
                selectedCandidate?: string;
                notes?: string;
            };
        }>,
        reply: FastifyReply
    ): Promise<void> {
        if (!request.session.get("isAdmin")) {
            return reply.status(401).send({ error: "Unauthorized" });
        }

        const electionID = request.params.id;
        const { resolutionType, selectedCandidate, notes } = request.body;
        const adminID = request.session.get("adminID") as string;

        try {
            const election = this.electionService.getElectionById(electionID);
            if (!election) {
                return reply.status(404).send({ error: "Election not found" });
            }

            if (election.status !== "CLOSED") {
                return reply.status(400).send({ error: "Election must be closed to resolve ties" });
            }

            const results = this.votingService.calculateResults(electionID);
            const tiedCandidates = results.filter((r) => r.isTied);

            if (tiedCandidates.length === 0) {
                return reply.status(400).send({ error: "No tie to resolve in this election" });
            }

            const existingResolution = this.tieResolutionRepository.findByElectionId(electionID);
            if (existingResolution) {
                return reply.status(400).send({ error: "Tie has already been resolved" });
            }

            let winnerCandidateID: string | null = null;

            switch (resolutionType) {
                case "RANDOM":
                    const randomIndex = randomInt(tiedCandidates.length);
                    winnerCandidateID = tiedCandidates[randomIndex].candidateID;
                    break;

                case "MANUAL":
                    if (!selectedCandidate) {
                        return reply.status(400).send({ error: "Manual resolution requires selecting a candidate" });
                    }
                    const isValidSelection = tiedCandidates.some((c) => c.candidateID === selectedCandidate);
                    if (!isValidSelection) {
                        return reply.status(400).send({ error: "Selected candidate is not among the tied candidates" });
                    }
                    winnerCandidateID = selectedCandidate;
                    break;

                case "RECALL":
                    winnerCandidateID = null;
                    break;

                default:
                    return reply.status(400).send({ error: "Invalid resolution type" });
            }

            const resolution: TieResolution = {
                resolutionID: uuidv4(),
                electionID,
                resolutionType,
                winnerCandidateID,
                resolvedBy: adminID,
                resolvedAt: new Date(),
                notes: notes || null,
            };

            this.tieResolutionRepository.save(resolution);

            return reply.redirect(`/admin/elections/${electionID}`);
        } catch (error: any) {
            return reply.status(400).send({ error: error.message });
        }
    }
}
