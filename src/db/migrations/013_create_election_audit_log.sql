-- Audit log table for tracking election state transitions (Observer pattern)
CREATE TABLE IF NOT EXISTS election_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    election_id TEXT NOT NULL,
    election_name TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (election_id) REFERENCES elections(election_id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_election_id ON election_audit_log(election_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON election_audit_log(timestamp);
