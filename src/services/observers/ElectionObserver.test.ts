import { ElectionEventEmitter } from "./ElectionEventEmitter";
import { ElectionAuditLogger, AuditEntry } from "./ElectionAuditLogger";
import { ElectionNotifier } from "./ElectionNotifier";
import { IElectionObserver } from "./interfaces/IElectionObserver";
import { ElectionEvent } from "../../domain/entities/ElectionEvent";
import { IAuditLogRepository } from "../../repositories/interfaces/IAuditLogRepository";
import { Election } from "../../domain/entities/Election";
import { ElectionType, ElectionStatus } from "../../domain/enums";

class MockAuditLogRepository implements IAuditLogRepository {
    private entries: AuditEntry[] = [];

    save(entry: AuditEntry): void {
        this.entries.push({ ...entry });
    }

    findAll(): AuditEntry[] {
        return this.entries.map((e) => ({ ...e }));
    }

    findByElectionId(electionID: string): AuditEntry[] {
        return this.entries.filter((e) => e.electionID === electionID).map((e) => ({ ...e }));
    }

    count(): number {
        return this.entries.length;
    }
}

function createTestElection(
    overrides: Partial<{
        id: string;
        name: string;
        type: ElectionType;
        status: ElectionStatus;
    }> = {}
): Election {
    return new Election(
        overrides.id || "election-1",
        overrides.name || "Test Election",
        overrides.type || ElectionType.FPTP,
        new Date("2026-03-01"),
        new Date("2026-03-31"),
        "A test election",
        overrides.status || ElectionStatus.DRAFT
    );
}

describe("ElectionEventEmitter", () => {
    let emitter: ElectionEventEmitter;

    beforeEach(() => {
        emitter = new ElectionEventEmitter();
    });

    it("starts with no observers", () => {
        expect(emitter.getObserverCount()).toBe(0);
    });

    it("adds an observer on subscribe", () => {
        const observer: IElectionObserver = {
            onElectionStateChange: jest.fn(),
        };

        emitter.subscribe(observer);
        expect(emitter.getObserverCount()).toBe(1);
    });

    it("ignores duplicate subscribes", () => {
        const observer: IElectionObserver = {
            onElectionStateChange: jest.fn(),
        };

        emitter.subscribe(observer);
        emitter.subscribe(observer);
        expect(emitter.getObserverCount()).toBe(1);
    });

    it("removes an observer on unsubscribe", () => {
        const observer: IElectionObserver = {
            onElectionStateChange: jest.fn(),
        };

        emitter.subscribe(observer);
        expect(emitter.getObserverCount()).toBe(1);

        emitter.unsubscribe(observer);
        expect(emitter.getObserverCount()).toBe(0);
    });

    it("notifies all observers on state change", () => {
        const observer1: IElectionObserver = { onElectionStateChange: jest.fn() };
        const observer2: IElectionObserver = { onElectionStateChange: jest.fn() };

        emitter.subscribe(observer1);
        emitter.subscribe(observer2);

        const election = createTestElection();
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(observer1.onElectionStateChange).toHaveBeenCalledTimes(1);
        expect(observer2.onElectionStateChange).toHaveBeenCalledTimes(1);
    });

    it("passes the right event payload", () => {
        const observer: IElectionObserver = { onElectionStateChange: jest.fn() };
        emitter.subscribe(observer);

        const election = createTestElection({ name: "General Election 2026" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        const event: ElectionEvent = (observer.onElectionStateChange as jest.Mock).mock.calls[0][0];
        expect(event.election.name).toBe("General Election 2026");
        expect(event.previousStatus).toBe(ElectionStatus.DRAFT);
        expect(event.newStatus).toBe(ElectionStatus.ACTIVE);
        expect(event.timestamp).toBeInstanceOf(Date);
    });

    it("does not notify after unsubscribe", () => {
        const observer: IElectionObserver = { onElectionStateChange: jest.fn() };

        emitter.subscribe(observer);
        emitter.unsubscribe(observer);

        const election = createTestElection();
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(observer.onElectionStateChange).not.toHaveBeenCalled();
    });

    it("catches observer errors without blocking other observers", () => {
        const failingObserver: IElectionObserver = {
            onElectionStateChange: jest.fn(() => {
                throw new Error("Observer crashed");
            }),
        };
        const healthyObserver: IElectionObserver = { onElectionStateChange: jest.fn() };

        emitter.subscribe(failingObserver);
        emitter.subscribe(healthyObserver);

        const election = createTestElection();

        expect(() => {
            emitter.notify(election, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);
        }).not.toThrow();

        expect(healthyObserver.onElectionStateChange).toHaveBeenCalledTimes(1);
    });

    it("fires multiple times for multiple notifies", () => {
        const observer: IElectionObserver = { onElectionStateChange: jest.fn() };
        emitter.subscribe(observer);

        const election = createTestElection();
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        expect(observer.onElectionStateChange).toHaveBeenCalledTimes(2);
    });
});

describe("ElectionAuditLogger", () => {
    let auditLogger: ElectionAuditLogger;
    let emitter: ElectionEventEmitter;
    let mockRepo: MockAuditLogRepository;

    beforeEach(() => {
        mockRepo = new MockAuditLogRepository();
        auditLogger = new ElectionAuditLogger(mockRepo);
        emitter = new ElectionEventEmitter();
        emitter.subscribe(auditLogger);
    });

    it("starts empty", () => {
        expect(auditLogger.getEntryCount()).toBe(0);
        expect(auditLogger.getAuditLog()).toEqual([]);
    });

    it("logs an entry when an election is activated", () => {
        const election = createTestElection({ name: "Council Election" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(auditLogger.getEntryCount()).toBe(1);

        const entry = auditLogger.getAuditLog()[0];
        expect(entry.electionName).toBe("Council Election");
        expect(entry.previousStatus).toBe(ElectionStatus.DRAFT);
        expect(entry.newStatus).toBe(ElectionStatus.ACTIVE);
        expect(entry.timestamp).toBeInstanceOf(Date);
    });

    it("logs an entry when an election is closed", () => {
        const election = createTestElection({ id: "elec-123" });
        emitter.notify(election, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        const entry = auditLogger.getAuditLog()[0];
        expect(entry.electionID).toBe("elec-123");
        expect(entry.previousStatus).toBe(ElectionStatus.ACTIVE);
        expect(entry.newStatus).toBe(ElectionStatus.CLOSED);
    });

    it("accumulates entries across multiple events", () => {
        const election1 = createTestElection({ id: "e1", name: "Election A" });
        const election2 = createTestElection({ id: "e2", name: "Election B" });

        emitter.notify(election1, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election2, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election1, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        expect(auditLogger.getEntryCount()).toBe(3);
    });

    it("filters entries by election ID", () => {
        const election1 = createTestElection({ id: "e1", name: "Election A" });
        const election2 = createTestElection({ id: "e2", name: "Election B" });

        emitter.notify(election1, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election2, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election1, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        const e1Entries = auditLogger.getEntriesForElection("e1");
        expect(e1Entries).toHaveLength(2);
        expect(e1Entries[0].newStatus).toBe(ElectionStatus.ACTIVE);
        expect(e1Entries[1].newStatus).toBe(ElectionStatus.CLOSED);
    });

    it("returns a copy so callers can't mutate the log", () => {
        const election = createTestElection();
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        const log = auditLogger.getAuditLog();
        log.pop();

        expect(auditLogger.getEntryCount()).toBe(1);
    });
});

describe("ElectionNotifier", () => {
    let notifier: ElectionNotifier;
    let emitter: ElectionEventEmitter;

    beforeEach(() => {
        notifier = new ElectionNotifier();
        emitter = new ElectionEventEmitter();
        emitter.subscribe(notifier);
    });

    it("starts with no notifications", () => {
        expect(notifier.getNotificationCount()).toBe(0);
    });

    it("creates an election_opened notification when status becomes ACTIVE", () => {
        const election = createTestElection({ name: "Mayoral Election" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(notifier.getNotificationCount()).toBe(1);

        const notification = notifier.getNotifications()[0];
        expect(notification.type).toBe("election_opened");
        expect(notification.message).toContain("Mayoral Election");
        expect(notification.message).toContain("open for voting");
    });

    it("creates an election_closed notification when status becomes CLOSED", () => {
        const election = createTestElection({ name: "Budget Referendum" });
        emitter.notify(election, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        const notification = notifier.getNotifications()[0];
        expect(notification.type).toBe("election_closed");
        expect(notification.message).toContain("Budget Referendum");
        expect(notification.message).toContain("closed");
    });

    it("falls back to generic notification for other transitions", () => {
        const election = createTestElection();
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.DRAFT);

        const notification = notifier.getNotifications()[0];
        expect(notification.type).toBe("election_status_change");
    });

    it("filters notifications by election ID", () => {
        const election1 = createTestElection({ id: "e1" });
        const election2 = createTestElection({ id: "e2" });

        emitter.notify(election1, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election2, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        const e1Notifications = notifier.getNotificationsForElection("e1");
        expect(e1Notifications).toHaveLength(1);
    });

    it("includes election ID and timestamp", () => {
        const election = createTestElection({ id: "elec-abc" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        const notification = notifier.getNotifications()[0];
        expect(notification.electionID).toBe("elec-abc");
        expect(notification.timestamp).toBeInstanceOf(Date);
    });
});

describe("Multiple observers together", () => {
    it("notifies both the audit logger and notifier on activation", () => {
        const mockRepo = new MockAuditLogRepository();
        const emitter = new ElectionEventEmitter();
        const auditLogger = new ElectionAuditLogger(mockRepo);
        const notifier = new ElectionNotifier();

        emitter.subscribe(auditLogger);
        emitter.subscribe(notifier);

        const election = createTestElection({ name: "Integration Test Election" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(auditLogger.getEntryCount()).toBe(1);
        expect(notifier.getNotificationCount()).toBe(1);

        expect(auditLogger.getAuditLog()[0].previousStatus).toBe(ElectionStatus.DRAFT);
        expect(auditLogger.getAuditLog()[0].newStatus).toBe(ElectionStatus.ACTIVE);
        expect(notifier.getNotifications()[0].type).toBe("election_opened");
    });

    it("tracks the full draft -> active -> closed lifecycle", () => {
        const mockRepo = new MockAuditLogRepository();
        const emitter = new ElectionEventEmitter();
        const auditLogger = new ElectionAuditLogger(mockRepo);
        const notifier = new ElectionNotifier();

        emitter.subscribe(auditLogger);
        emitter.subscribe(notifier);

        const election = createTestElection({ id: "lifecycle-test" });

        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);
        emitter.notify(election, ElectionStatus.ACTIVE, ElectionStatus.CLOSED);

        expect(auditLogger.getEntryCount()).toBe(2);
        const entries = auditLogger.getEntriesForElection("lifecycle-test");
        expect(entries[0].newStatus).toBe(ElectionStatus.ACTIVE);
        expect(entries[1].newStatus).toBe(ElectionStatus.CLOSED);

        expect(notifier.getNotificationCount()).toBe(2);
        expect(notifier.getNotifications()[0].type).toBe("election_opened");
        expect(notifier.getNotifications()[1].type).toBe("election_closed");
    });

    it("persists entries through the repository", () => {
        const mockRepo = new MockAuditLogRepository();
        const emitter = new ElectionEventEmitter();
        const auditLogger = new ElectionAuditLogger(mockRepo);

        emitter.subscribe(auditLogger);

        const election = createTestElection({ name: "Persistence Test" });
        emitter.notify(election, ElectionStatus.DRAFT, ElectionStatus.ACTIVE);

        expect(mockRepo.count()).toBe(1);

        // a second logger using the same repo should see the same data
        const secondLogger = new ElectionAuditLogger(mockRepo);
        expect(secondLogger.getEntryCount()).toBe(1);
        expect(secondLogger.getAuditLog()[0].electionName).toBe("Persistence Test");
    });
});
