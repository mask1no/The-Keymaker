#!/usr/bin/env sh
set -e

# Initialize sqlite database if missing
if [ ! -f "./data/keymaker.db" ] && [ -f "./init.sql" ]; then
  echo "Initializing database at ./data/keymaker.db ..."
  mkdir -p ./data
  # Ensure correct ownership for runtime writes
  chown -R node:node ./data || true
  sqlite3 ./data/keymaker.db < ./init.sql || true
fi

echo "Starting Keymaker (Next.js standalone)..."
exec node server.js