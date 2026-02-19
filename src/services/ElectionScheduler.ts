/**
 * ElectionScheduler - Background service that automatically closes elections
 * when their end date/time is reached and starts elections when their start date is reached.
 */

import { ElectionService } from "./ElectionService";
import { ElectionStatus } from "../domain/enums";

export class ElectionScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private readonly checkIntervalMs: number;

    constructor(
        private electionService: ElectionService,
        checkIntervalMs: number = 60000 // Default: check every minute
    ) {
        this.checkIntervalMs = checkIntervalMs;
    }

    /**
     * Start the scheduler
     */
    start(): void {
        if (this.intervalId) {
            console.log("[Scheduler] Already running");
            return;
        }

        console.log(`[Scheduler] Starting election scheduler (checking every ${this.checkIntervalMs / 1000}s)`);

        // Run immediately on start
        this.checkElections();

        // Then run on interval
        this.intervalId = setInterval(() => {
            this.checkElections();
        }, this.checkIntervalMs);
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log("[Scheduler] Stopped");
        }
    }

    /**
     * Check all elections and close those that have passed their end date
     */
    private checkElections(): void {
        const now = new Date();
        const elections = this.electionService.getAllElections();

        for (const election of elections) {
            try {
                // Auto-close ACTIVE elections that have reached their end date
                if (election.status === ElectionStatus.ACTIVE) {
                    const endDate = new Date(election.endDate);
                    if (endDate <= now) {
                        console.log(`[Scheduler] Auto-closing election: ${election.name}`);
                        this.electionService.closeElection(election.electionID);
                    }
                }
            } catch (err) {
                console.error(`[Scheduler] Error processing election ${election.electionID}:`, err);
            }
        }
    }

    /**
     * Check if the scheduler is running
     */
    isRunning(): boolean {
        return this.intervalId !== null;
    }
}
