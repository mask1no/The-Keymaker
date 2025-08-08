#!/usr/bin/env sh
set -e

# optional: initialize sqlite if missing
if [ ! -f "./data/app.db" ] && [ -f "./scripts/init.sql" ]; then
  echo "Initializing database..."
  sqlite3 ./data/app.db < ./scripts/init.sql || true
fi

echo "Starting Keymaker..."
exec pnpm start