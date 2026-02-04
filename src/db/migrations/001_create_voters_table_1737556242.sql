CREATE TABLE IF NOT EXISTS voters (
    voter_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    registration_status TEXT NOT NULL CHECK(registration_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    registration_date TEXT NOT NULL
);

CREATE INDEX idx_voters_email ON voters(email);
CREATE INDEX idx_voters_status ON voters(registration_status);
