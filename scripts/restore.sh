#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file>"
  exit 1
fi

BACKUP_FILE=$1
DB_NAME=${POSTGRES_DB:-captagov}
DB_USER=${POSTGRES_USER:-captagov}
DB_HOST=${POSTGRES_HOST:-localhost}
DB_PORT=${POSTGRES_PORT:-5432}

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File $BACKUP_FILE not found"
  exit 1
fi

echo "Restoring database $DB_NAME from $BACKUP_FILE..."
PGPASSWORD=$POSTGRES_PASSWORD pg_restore \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --clean \
  --if-exists \
  -v \
  "$BACKUP_FILE"

echo "Restore complete"
