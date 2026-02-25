-- Add Cloudflare Turnstile settings
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('turnstile_enabled', 'false', datetime('now'));
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('turnstile_site_key', '', datetime('now'));
INSERT OR IGNORE INTO settings (key, value, updated_at) VALUES ('turnstile_secret_key', '', datetime('now'));
