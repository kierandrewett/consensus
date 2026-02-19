import Database from "better-sqlite3";
import envPaths from "env-paths";
import { readFileSync, readdirSync } from "fs";
import { ensureDirSync } from "fs-extra";
import { dirname, join } from "path";

// Allow DATA_DIR env override for Docker, otherwise use XDG paths
const dataDir = process.env.DATA_DIR || envPaths("consensus", { suffix: "" }).data;

export class DatabaseConnection {
    private static instance: Database.Database | null = null;
    public static readonly DB_PATH = join(dataDir, "database.sqlite");
    private static readonly MIGRATIONS_PATH = join(__dirname, "migrations");

    private constructor() {}

    public static getInstance(): Database.Database {
        if (!DatabaseConnection.instance) {
            console.log("Loading database from:", DatabaseConnection.DB_PATH);

            ensureDirSync(dirname(DatabaseConnection.DB_PATH));

            DatabaseConnection.instance = new Database(DatabaseConnection.DB_PATH);
            DatabaseConnection.instance.pragma("foreign_keys = ON");
        }

        return DatabaseConnection.instance;
    }

    public static runMigrations(): void {
        if (!DatabaseConnection.instance) {
            throw new Error("Database connection not initialized. Call getInstance() first.");
        }

        // Create migrations tracking table
        DatabaseConnection.instance!.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL
            )
        `);

        // Get applied migrations
        const appliedMigrations = DatabaseConnection.instance!.prepare(
            "SELECT version FROM schema_migrations ORDER BY version"
        ).all() as { version: number }[];

        const appliedVersions = new Set(appliedMigrations.map((m) => m.version));

        // Read and sort migration files
        const migrationFiles = readdirSync(DatabaseConnection.MIGRATIONS_PATH)
            .filter((file) => file.endsWith(".sql"))
            .sort();

        console.log(`\nDatabase Migrations:`);
        console.log(`Applied: ${appliedVersions.size}, Available: ${migrationFiles.length}`);

        // Apply pending migrations
        for (const file of migrationFiles) {
            const version = parseInt(file.split("_")[0]);

            if (appliedVersions.has(version)) {
                console.log(`✓ Migration ${version}: ${file} (already applied)`);
                continue;
            }

            console.log(`▶ Running migration ${version}: ${file}`);

            const migrationSQL = readFileSync(join(DatabaseConnection.MIGRATIONS_PATH, file), "utf-8");

            try {
                DatabaseConnection.instance!.exec(migrationSQL);

                // Record migration as applied
                DatabaseConnection.instance!.prepare(
                    `
                    INSERT INTO schema_migrations (version, name, applied_at)
                    VALUES (?, ?, ?)
                `
                ).run(version, file, new Date().toISOString());

                console.log(`✓ Migration ${version}: ${file} (completed)`);
            } catch (error) {
                console.error(`✗ Migration ${version}: ${file} (failed)`);
                throw error;
            }
        }

        console.log("");
    }

    public static close(): void {
        if (DatabaseConnection.instance) {
            DatabaseConnection.instance.close();
            DatabaseConnection.instance = null;
        }
    }

    public static getTestInstance(path: string = ":memory:"): Database.Database {
        const db = new Database(path);
        db.pragma("foreign_keys = ON");

        // Run migrations for test database
        db.exec(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL
            )
        `);

        const migrationFiles = readdirSync(DatabaseConnection.MIGRATIONS_PATH)
            .filter((file) => file.endsWith(".sql"))
            .sort();

        for (const file of migrationFiles) {
            const version = parseInt(file.split("_")[0]);
            const migrationSQL = readFileSync(join(DatabaseConnection.MIGRATIONS_PATH, file), "utf-8");
            db.exec(migrationSQL);
            db.prepare(
                `
                INSERT INTO schema_migrations (version, name, applied_at)
                VALUES (?, ?, ?)
            `
            ).run(version, file, new Date().toISOString());
        }

        return db;
        return db;
    }
}
