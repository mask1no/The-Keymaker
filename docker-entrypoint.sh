#!/bin/sh
set -e

# Initialize database if it doesn't exist
if [ ! -f "/app/data/keymaker.db" ]; then
  echo "Initializing database..."
  cd /app
  # Create database from SQL file
  if [ -f "/app/init.sql" ]; then
    sqlite3 /app/data/keymaker.db < /app/init.sql
    echo "Database initialized successfully"
  else
    echo "Warning: init.sql not found, starting without database"
  fi
fi

# Mask sensitive environment variables in logs
export NODE_OPTIONS="--max-old-space-size=4096"

# Handle signals for graceful shutdown
trap 'echo "Received SIGTERM, shutting down gracefully..."; kill -TERM $PID; wait $PID' SIGTERM
trap 'echo "Received SIGINT, shutting down gracefully..."; kill -INT $PID; wait $PID' SIGINT

# Start the Next.js standalone server
node server.js &
PID=$!

# Wait for the process
wait $PID 