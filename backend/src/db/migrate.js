import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config/index.js";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to get all migration files
const getMigrationFiles = () => {
    const migrationsDir = path.join(__dirname, "../../db/migrations");
    return fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort(); // Ensure they run in order (001, 002, etc.)
};

const runMigrations = async () => {
    console.log("🚀 Starting database migrations...");
    console.log(`📡 Connecting to ${config.database.database} at ${config.database.host}:${config.database.port}`);

    const pool = new Pool(config.database);

    try {
        const client = await pool.connect();

        // Create migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

        const files = getMigrationFiles();

        for (const file of files) {
            // Check if migration already applied
            const result = await client.query(
                "SELECT id FROM migrations WHERE name = $1",
                [file]
            );

            if (result.rows.length === 0) {
                console.log(`📝 Applying migration: ${file}`);
                const filePath = path.join(__dirname, "../../db/migrations", file);
                const sql = fs.readFileSync(filePath, "utf8");

                try {
                    await client.query("BEGIN");
                    await client.query(sql);
                    await client.query(
                        "INSERT INTO migrations (name) VALUES ($1)",
                        [file]
                    );
                    await client.query("COMMIT");
                    console.log(`✅ Applied: ${file}`);
                } catch (err) {
                    await client.query("ROLLBACK");
                    console.error(`❌ Failed to apply ${file}:`, err);
                    throw err;
                }
            } else {
                console.log(`⏭️  Skipping: ${file} (Already applied)`);
            }
        }

        console.log("🎉 All migrations completed successfully!");
        client.release();
    } catch (err) {
        console.error("❌ Migration failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

runMigrations();
