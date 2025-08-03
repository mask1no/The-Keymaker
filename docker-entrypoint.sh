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

# Apply database migrations if migrations directory exists
if [ -d "/app/scripts/migrations" ]; then
  echo "Applying database migrations..."
  for migration in /app/scripts/migrations/*.sql; do
    if [ -f "$migration" ]; then
      echo "Applying migration: $(basename $migration)"
      sqlite3 /app/data/keymaker.db < "$migration" || echo "Migration already applied or failed: $(basename $migration)"
    fi
  done
fi

# Mask sensitive environment variables in logs
export NODE_OPTIONS="--max-old-space-size=4096"

# Write PID files for monitoring
NEXTJS_PID_FILE=/var/run/nextjs.pid
NGINX_PID_FILE=/var/run/nginx.pid

# Graceful shutdown function
shutdown() {
  echo "Shutting down services..."
  
  # Stop accepting new connections
  if [ -f "$NGINX_PID_FILE" ]; then
    echo "Stopping nginx..."
    kill -QUIT $(cat $NGINX_PID_FILE) 2>/dev/null || true
  fi
  
  # Wait for existing connections to complete (max 30s)
  echo "Waiting for existing connections to complete..."
  sleep 2
  
  # Stop Next.js app
  if [ -f "$NEXTJS_PID_FILE" ]; then
    echo "Stopping Next.js application..."
    kill -TERM $(cat $NEXTJS_PID_FILE) 2>/dev/null || true
  fi
  
  # Wait for processes to terminate
  wait
  
  echo "Shutdown complete"
  exit 0
}

# Handle signals for graceful shutdown
trap 'shutdown' SIGTERM SIGINT SIGQUIT

# Start nginx in the background
echo "Starting nginx..."
nginx -g "daemon off;" &
echo $! > $NGINX_PID_FILE

# Give nginx time to start
sleep 2

# Start the Next.js standalone server
echo "Starting Next.js application..."
node server.js &
echo $! > $NEXTJS_PID_FILE

# Wait for both processes
wait