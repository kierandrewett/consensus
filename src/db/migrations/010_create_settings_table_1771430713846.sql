CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES 
    ('banner_message', '', datetime('now')),
    ('banner_enabled', 'false', datetime('now')),
    ('banner_type', 'info', datetime('now')),
    ('signup_enabled', 'true', datetime('now')),
    ('login_enabled', 'true', datetime('now')),
    ('maintenance_mode', 'false', datetime('now')),
    ('maintenance_message', 'The system is currently under maintenance. Please check back later.', datetime('now'));
