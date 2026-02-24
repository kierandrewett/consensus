import { ElectionEvent } from "../../../domain/entities/ElectionEvent";

export interface IElectionObserver {
    onElectionStateChange(event: ElectionEvent): void;
}
