#!/bin/bash
# ============================================
# ScriptHub.id — Daily PostgreSQL Backup to S3
# ============================================
# Uses pg_dump --format=custom for reliable, non-corrupt backups
# that support full restore including large objects.
#
# Usage: ./backup.sh              (runs backup once)
#        ./backup.sh --cron       (starts daily cron at 3:00 AM UTC)
# ============================================

set -euo pipefail

# ── Config from environment ──────────────────────────────────────
PGHOST="${POSTGRES_HOST:-postgres}"
PGPORT="${POSTGRES_PORT:-5432}"
PGUSER="${POSTGRES_USER:-scripthub_user}"
PGPASSWORD="${POSTGRES_PASSWORD}"
PGDATABASE="${POSTGRES_DB:-scripthub}"
export PGPASSWORD

S3_ENDPOINT="${S3_ENDPOINT}"
S3_BUCKET="${S3_BACKUP_BUCKET:-cdn.scripthub.id}"
S3_PREFIX="${S3_BACKUP_PREFIX:-backups/db}"
S3_REGION="${S3_REGION:-ap-southeast-2}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

TIMESTAMP=$(date +%Y-%m-%d_%H%M%S)
BACKUP_FILE="/tmp/scripthub_${TIMESTAMP}.dump"
BACKUP_GZ="/tmp/scripthub_${TIMESTAMP}.dump.gz"
S3_KEY="${S3_PREFIX}/scripthub_${TIMESTAMP}.dump.gz"

# ── Logging helpers ──────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [BACKUP] $*"; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]  $*" >&2; }

# ── Run the backup ───────────────────────────────────────────────
do_backup() {
    log "Starting PostgreSQL backup..."
    log "Host: ${PGHOST}:${PGPORT} | DB: ${PGDATABASE} | User: ${PGUSER}"

    # Step 1: pg_dump with --format=custom (binary, portable, non-corrupt)
    # --no-owner: skip ownership so restore works with any user
    # --blobs: include large objects
    # --verbose: log what's happening
    log "Step 1/4: Running pg_dump (format=custom)..."
    pg_dump \
        --host="${PGHOST}" \
        --port="${PGPORT}" \
        --username="${PGUSER}" \
        --dbname="${PGDATABASE}" \
        --format=custom \
        --blobs \
        --no-owner \
        --verbose \
        --file="${BACKUP_FILE}" 2>&1 | while IFS= read -r line; do log "  pg_dump: $line"; done

    if [ ! -f "${BACKUP_FILE}" ]; then
        err "pg_dump failed — no output file created!"
        return 1
    fi

    DUMP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "Step 1 done. Dump size: ${DUMP_SIZE}"

    # Step 2: Verify the dump is not corrupt
    log "Step 2/4: Verifying dump integrity..."
    TABLE_COUNT=$(pg_restore --list "${BACKUP_FILE}" 2>/dev/null | grep -c "TABLE" || true)
    if [ "${TABLE_COUNT}" -eq 0 ]; then
        err "Dump verification failed — no tables found in backup!"
        rm -f "${BACKUP_FILE}"
        return 1
    fi
    log "Step 2 done. Found ${TABLE_COUNT} table entries — dump is valid."

    # Step 3: Compress with gzip
    log "Step 3/4: Compressing with gzip..."
    gzip -9 "${BACKUP_FILE}"
    GZ_SIZE=$(du -h "${BACKUP_GZ}" | cut -f1)
    log "Step 3 done. Compressed size: ${GZ_SIZE}"

    # Step 4: Upload to S3
    log "Step 4/4: Uploading to s3://${S3_BUCKET}/${S3_KEY}..."
    aws s3 cp "${BACKUP_GZ}" "s3://${S3_BUCKET}/${S3_KEY}" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region "${S3_REGION}" \
        --no-progress

    if [ $? -eq 0 ]; then
        log "Upload successful! ✅"
    else
        err "Upload to S3 failed!"
        rm -f "${BACKUP_GZ}"
        return 1
    fi

    # Cleanup local file
    rm -f "${BACKUP_GZ}"

    # Step 5: Retention — delete backups older than N days
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Calculate cutoff date (POSIX-compatible, works on both GNU and BusyBox)
    CUTOFF_EPOCH=$(( $(date +%s) - (RETENTION_DAYS * 86400) ))

    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region "${S3_REGION}" 2>/dev/null | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        if [ -n "${FILE_NAME}" ] && [ -n "${FILE_DATE}" ]; then
            # Extract date from filename (scripthub_YYYY-MM-DD_HHmmss.dump.gz)
            FILE_YMD=$(echo "${FILE_NAME}" | sed -n 's/scripthub_\([0-9-]*\)_.*/\1/p')
            if [ -n "${FILE_YMD}" ]; then
                # Convert YYYY-MM-DD to epoch for comparison
                FILE_EPOCH=$(date -d "${FILE_YMD}" +%s 2>/dev/null || echo "0")
                if [ "${FILE_EPOCH}" = "0" ]; then
                    # BusyBox fallback: compare date strings directly
                    CUTOFF_DATE=$(date -u +%Y-%m-%d -d "@${CUTOFF_EPOCH}" 2>/dev/null || date -u +%Y-%m-%d)
                    if [ "${FILE_YMD}" \< "${CUTOFF_DATE}" ]; then
                        FILE_EPOCH=1  # mark as old
                    else
                        FILE_EPOCH=$((CUTOFF_EPOCH + 1))  # mark as recent
                    fi
                fi
                if [ "${FILE_EPOCH}" -lt "${CUTOFF_EPOCH}" ]; then
                    log "  Deleting old backup: ${FILE_NAME}"
                    aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}" \
                        --endpoint-url "${S3_ENDPOINT}" \
                        --region "${S3_REGION}" 2>/dev/null
                fi
            fi
        fi
    done

    log "=========================================="
    log "Backup completed successfully! 🎉"
    log "  File: s3://${S3_BUCKET}/${S3_KEY}"
    log "  Size: ${GZ_SIZE}"
    log "  Tables: ${TABLE_COUNT}"
    log "=========================================="
}

# ── Cron mode ────────────────────────────────────────────────────
setup_cron() {
    log "Setting up daily backup cron (3:00 AM UTC)..."

    # Write environment variables to a file so cron can access them
    printenv | grep -E '^(POSTGRES_|S3_|BACKUP_|AWS_|PATH=)' > /etc/environment.backup

    # Create cron job
    echo "0 3 * * * . /etc/environment.backup && /scripts/backup.sh >> /var/log/backup.log 2>&1" | crontab -

    log "Cron installed. Running initial backup now..."
    do_backup

    log "Starting cron daemon..."
    crond -f -l 2
}

# ── Main ─────────────────────────────────────────────────────────
if [ "${1:-}" = "--cron" ]; then
    setup_cron
else
    do_backup
fi
