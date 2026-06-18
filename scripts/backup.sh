#!/bin/sh
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=${BACKUP_DIR:-./backups}
DB_NAME=${POSTGRES_DB:-captagov}
DB_USER=${POSTGRES_USER:-captagov}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}

mkdir -p "$BACKUP_DIR"

echo "Backing up database $DB_NAME..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F c \
  -f "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

echo "Backup created: $BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.dump"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "${DB_NAME}_*.dump" -mtime +7 -delete
echo "Cleaned up backups older than 7 days"
