CREATE TABLE IF NOT EXISTS voter_eligibility (
    voter_id TEXT NOT NULL,
    election_id TEXT NOT NULL,
    has_voted INTEGER NOT NULL DEFAULT 0, -- 0 = not voted, 1 = voted
    voted_at TEXT, -- Timestamp when vote was cast
    PRIMARY KEY (voter_id, election_id),
    FOREIGN KEY (voter_id) REFERENCES voters(voter_id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(election_id) ON DELETE CASCADE
);

CREATE INDEX idx_eligibility_voter ON voter_eligibility(voter_id);
CREATE INDEX idx_eligibility_election ON voter_eligibility(election_id);
CREATE INDEX idx_eligibility_voted ON voter_eligibility(has_voted);
