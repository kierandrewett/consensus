CREATE TABLE IF NOT EXISTS vote_confirmations (
    confirmation_id TEXT PRIMARY KEY,
    voter_id TEXT NOT NULL,
    election_id TEXT NOT NULL,
    confirmed_at TEXT NOT NULL,
    FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);

CREATE INDEX idx_confirmations_voter ON vote_confirmations(voter_id);
CREATE INDEX idx_confirmations_election ON vote_confirmations(election_id);
