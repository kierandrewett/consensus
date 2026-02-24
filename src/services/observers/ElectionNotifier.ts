import { ElectionStatus } from "../../domain/enums";
import { ElectionEvent } from "../../domain/entities/ElectionEvent";
import { IElectionObserver } from "./interfaces/IElectionObserver";

export interface Notification {
    type: "election_opened" | "election_closed" | "election_status_change";
    message: string;
    electionID: string;
    timestamp: Date;
}

export class ElectionNotifier implements IElectionObserver {
    private notifications: Notification[] = [];

    onElectionStateChange(event: ElectionEvent): void {
        let notification: Notification;

        if (event.newStatus === ElectionStatus.ACTIVE) {
            notification = {
                type: "election_opened",
                message: `Election "${event.election.name}" is now open for voting.`,
                electionID: event.election.electionID,
                timestamp: event.timestamp,
            };
        } else if (event.newStatus === ElectionStatus.CLOSED) {
            notification = {
                type: "election_closed",
                message: `Election "${event.election.name}" has closed. Results are now available.`,
                electionID: event.election.electionID,
                timestamp: event.timestamp,
            };
        } else {
            notification = {
                type: "election_status_change",
                message: `Election "${event.election.name}" status changed from ${event.previousStatus} to ${event.newStatus}.`,
                electionID: event.election.electionID,
                timestamp: event.timestamp,
            };
        }

        this.notifications.push(notification);
    }

    getNotifications(): Notification[] {
        return [...this.notifications];
    }

    getNotificationsForElection(electionID: string): Notification[] {
        return this.notifications.filter((n) => n.electionID === electionID);
    }

    getNotificationCount(): number {
        return this.notifications.length;
    }
}
