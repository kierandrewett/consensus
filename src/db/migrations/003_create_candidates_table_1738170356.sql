CREATE TABLE IF NOT EXISTS candidates (
    candidate_id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    name TEXT NOT NULL,
    party TEXT,
    biography TEXT,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);

CREATE INDEX idx_candidates_election ON candidates(election_id);
