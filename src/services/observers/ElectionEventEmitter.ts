import { Election } from "../../domain/entities/Election";
import { ElectionStatus } from "../../domain/enums";
import { ElectionEvent } from "../../domain/entities/ElectionEvent";
import { IElectionObserver } from "./interfaces/IElectionObserver";

export class ElectionEventEmitter {
    private observers: Set<IElectionObserver> = new Set();

    subscribe(observer: IElectionObserver): void {
        this.observers.add(observer);
    }

    unsubscribe(observer: IElectionObserver): void {
        this.observers.delete(observer);
    }

    /** Builds the event and fans it out to all observers, catching errors so one bad observer doesn't break the rest */
    notify(election: Election, previousStatus: ElectionStatus, newStatus: ElectionStatus): void {
        const event = new ElectionEvent(election, previousStatus, newStatus);

        for (const observer of this.observers) {
            try {
                observer.onElectionStateChange(event);
            } catch (error) {
                console.error(`[ElectionEventEmitter] Observer error:`, error);
            }
        }
    }

    getObserverCount(): number {
        return this.observers.size;
    }
}
