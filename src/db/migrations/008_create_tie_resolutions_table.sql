CREATE TABLE IF NOT EXISTS tie_resolutions (
    resolution_id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL REFERENCES elections(election_id),
    resolution_type TEXT NOT NULL CHECK(resolution_type IN ('RANDOM', 'MANUAL', 'RECALL')),
    winner_candidate_id TEXT REFERENCES candidates(candidate_id),
    resolved_by TEXT NOT NULL REFERENCES admins(admin_id),
    resolved_at TEXT NOT NULL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tie_resolutions_election ON tie_resolutions(election_id);
