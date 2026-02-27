import cron from "node-cron";
import { exec } from "child_process";
import { promisify } from "util";
import config from "../../config/index.js";
import logger from "../../utils/logger.js";

const execAsync = promisify(exec);

// ── Config ──────────────────────────────────────────────────────
const BACKUP_SCHEDULE = "0 3 * * *"; // Daily at 3:00 AM UTC

/**
 * Run the backup shell script
 * Uses pg_dump --format=custom for reliable, non-corrupt backups
 */
const runBackup = async () => {
    const startTime = Date.now();
    logger.info("[BACKUP] Starting daily database backup...");

    try {
        const { stdout, stderr } = await execAsync("bash /app/scripts/backup.sh", {
            timeout: 300000, // 5 minutes max
            env: {
                ...process.env,
                PGPASSWORD: config.db.password,
                POSTGRES_HOST: config.db.host,
                POSTGRES_PORT: String(config.db.port),
                POSTGRES_USER: config.db.user,
                POSTGRES_DB: config.db.database,
                POSTGRES_PASSWORD: config.db.password,
                S3_ENDPOINT: process.env.S3_ENDPOINT,
                S3_REGION: process.env.S3_REGION,
                S3_BACKUP_BUCKET: process.env.S3_BACKUP_BUCKET || "cdn.scripthub.id",
                S3_BACKUP_PREFIX: process.env.S3_BACKUP_PREFIX || "backups/db",
                BACKUP_RETENTION_DAYS: process.env.BACKUP_RETENTION_DAYS || "30",
                AWS_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY,
                AWS_SECRET_ACCESS_KEY: process.env.S3_SECRET_KEY,
                PATH: process.env.PATH,
            },
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (stdout) {
            stdout.split("\n").forEach((line) => {
                if (line.trim()) logger.info(`[BACKUP] ${line}`);
            });
        }
        if (stderr) {
            stderr.split("\n").forEach((line) => {
                if (line.trim()) logger.warn(`[BACKUP] ${line}`);
            });
        }

        logger.info(`[BACKUP] Completed in ${duration}s ✅`);
    } catch (error) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        logger.error(`[BACKUP] Failed after ${duration}s ❌`, error.message);
        if (error.stdout) logger.error(`[BACKUP] stdout: ${error.stdout}`);
        if (error.stderr) logger.error(`[BACKUP] stderr: ${error.stderr}`);
    }
};

/**
 * Initialize the backup scheduler
 * Called from index.js on server startup
 */
export const initBackupScheduler = () => {
    if (process.env.ENABLE_BACKUP !== "true") {
        logger.info("[BACKUP] Backup disabled (ENABLE_BACKUP != true). Skipping scheduler.");
        return;
    }

    logger.info(`[BACKUP] Scheduler initialized — daily at 3:00 AM UTC`);
    logger.info(`[BACKUP] Bucket: ${process.env.S3_BACKUP_BUCKET || "cdn.scripthub.id"}/${process.env.S3_BACKUP_PREFIX || "backups/db"}`);
    logger.info(`[BACKUP] Retention: ${process.env.BACKUP_RETENTION_DAYS || 30} days`);

    // Schedule daily backup
    cron.schedule(BACKUP_SCHEDULE, () => {
        runBackup().catch((err) => {
            logger.error("[BACKUP] Unhandled error in backup job:", err);
        });
    });

    // Run initial backup 30 seconds after startup (optional, configurable)
    if (process.env.BACKUP_ON_STARTUP === "true") {
        logger.info("[BACKUP] Running startup backup in 30 seconds...");
        setTimeout(() => runBackup(), 30000);
    }
};

/**
 * Manually trigger a backup (for admin API endpoint if needed)
 */
export const triggerManualBackup = async () => {
    logger.info("[BACKUP] Manual backup triggered");
    return runBackup();
};
