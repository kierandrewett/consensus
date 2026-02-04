CREATE TABLE IF NOT EXISTS admins (
    admin_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX idx_admins_username ON admins(username);
