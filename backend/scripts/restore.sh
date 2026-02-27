#!/bin/bash
# ============================================
# ScriptHub.id — PostgreSQL Restore from S3 Backup
# ============================================
# Restores a database backup created by backup.sh
#
# Usage:
#   ./restore.sh                     (list available backups)
#   ./restore.sh <filename>          (restore specific backup)
#   ./restore.sh latest              (restore most recent backup)
#
# Example:
#   ./restore.sh scripthub_2026-02-25_030000.dump.gz
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

# ── Logging helpers ──────────────────────────────────────────────
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [RESTORE] $*"; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR]   $*" >&2; }

# ── List available backups ───────────────────────────────────────
list_backups() {
    log "Available backups in s3://${S3_BUCKET}/${S3_PREFIX}/:"
    echo ""
    aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region "${S3_REGION}" | sort -r | head -30 | while read -r line; do
        FILE_DATE=$(echo "$line" | awk '{print $1}')
        FILE_TIME=$(echo "$line" | awk '{print $2}')
        FILE_SIZE=$(echo "$line" | awk '{print $3}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')
        SIZE_MB=$(echo "scale=1; ${FILE_SIZE} / 1048576" | bc 2>/dev/null || echo "${FILE_SIZE}B")
        echo "  📦 ${FILE_NAME}  (${SIZE_MB}MB — ${FILE_DATE} ${FILE_TIME})"
    done
    echo ""
    echo "Usage: ./restore.sh <filename>"
    echo "       ./restore.sh latest"
}

# ── Restore a backup ────────────────────────────────────────────
do_restore() {
    local TARGET="$1"

    # Resolve "latest" keyword
    if [ "${TARGET}" = "latest" ]; then
        TARGET=$(aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
            --endpoint-url "${S3_ENDPOINT}" \
            --region "${S3_REGION}" | sort -r | head -1 | awk '{print $4}')
        if [ -z "${TARGET}" ]; then
            err "No backups found!"
            return 1
        fi
        log "Latest backup: ${TARGET}"
    fi

    local S3_KEY="${S3_PREFIX}/${TARGET}"
    local LOCAL_GZ="/tmp/${TARGET}"
    local LOCAL_DUMP="/tmp/${TARGET%.gz}"

    log "=========================================="
    log "⚠️  WARNING: This will DROP and RECREATE"
    log "    the database '${PGDATABASE}'!"
    log "=========================================="
    log ""
    log "Backup: s3://${S3_BUCKET}/${S3_KEY}"
    log "Target: ${PGHOST}:${PGPORT}/${PGDATABASE}"
    log ""

    # Ask for confirmation
    read -p "Are you sure? Type 'yes' to proceed: " CONFIRM
    if [ "${CONFIRM}" != "yes" ]; then
        log "Restore cancelled."
        return 0
    fi

    # Step 1: Download from S3
    log "Step 1/4: Downloading from S3..."
    aws s3 cp "s3://${S3_BUCKET}/${S3_KEY}" "${LOCAL_GZ}" \
        --endpoint-url "${S3_ENDPOINT}" \
        --region "${S3_REGION}" \
        --no-progress
    log "Downloaded: $(du -h "${LOCAL_GZ}" | cut -f1)"

    # Step 2: Decompress
    log "Step 2/4: Decompressing..."
    gunzip -f "${LOCAL_GZ}"
    log "Decompressed: $(du -h "${LOCAL_DUMP}" | cut -f1)"

    # Step 3: Verify dump
    log "Step 3/4: Verifying dump integrity..."
    TABLE_COUNT=$(pg_restore --list "${LOCAL_DUMP}" 2>/dev/null | grep -c "TABLE" || true)
    if [ "${TABLE_COUNT}" -eq 0 ]; then
        err "Dump verification failed — no tables found!"
        rm -f "${LOCAL_DUMP}"
        return 1
    fi
    log "Dump valid — ${TABLE_COUNT} table entries found."

    # Step 4: Restore
    log "Step 4/4: Restoring database..."

    # Drop and recreate database
    psql --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="postgres" \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${PGDATABASE}' AND pid <> pg_backend_pid();" 2>/dev/null || true

    psql --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="postgres" \
        -c "DROP DATABASE IF EXISTS ${PGDATABASE};" \
        -c "CREATE DATABASE ${PGDATABASE} OWNER ${PGUSER};"

    # Restore from dump
    pg_restore \
        --host="${PGHOST}" \
        --port="${PGPORT}" \
        --username="${PGUSER}" \
        --dbname="${PGDATABASE}" \
        --no-owner \
        --no-privileges \
        --verbose \
        "${LOCAL_DUMP}" 2>&1 | while IFS= read -r line; do log "  pg_restore: $line"; done

    # Cleanup
    rm -f "${LOCAL_DUMP}"

    log "=========================================="
    log "Restore completed successfully! ✅"
    log "  Source: s3://${S3_BUCKET}/${S3_KEY}"
    log "  Tables restored: ${TABLE_COUNT}"
    log "=========================================="
    log ""
    log "⚠️  Remember to restart the backend:"
    log "    docker restart backend-scripthub"
}

# ── Main ─────────────────────────────────────────────────────────
if [ -z "${1:-}" ]; then
    list_backups
else
    do_restore "$1"
fi
