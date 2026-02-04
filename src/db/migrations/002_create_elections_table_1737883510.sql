CREATE TABLE IF NOT EXISTS elections (
    election_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    election_type TEXT NOT NULL CHECK(election_type IN ('FPTP', 'STV', 'AV', 'PREFERENTIAL')),
    status TEXT NOT NULL CHECK(status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    description TEXT NOT NULL
);

CREATE INDEX idx_elections_status ON elections(status);
CREATE INDEX idx_elections_dates ON elections(start_date, end_date);
