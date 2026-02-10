-- Add guest voting and auto-approval settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('guest_voting_enabled', 'false', datetime('now'));
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('auto_approval_enabled', 'false', datetime('now'));
