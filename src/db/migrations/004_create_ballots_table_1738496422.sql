CREATE TABLE IF NOT EXISTS ballots (
    ballot_id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    preferences TEXT NOT NULL, -- JSON array of candidate IDs (single item for FPTP, multiple for preferential)
    cast_at TEXT NOT NULL,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);

CREATE INDEX idx_ballots_election ON ballots(election_id);
CREATE INDEX idx_ballots_timestamp ON ballots(cast_at);
