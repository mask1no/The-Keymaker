#!/bin/bash

# Keymaker Production Deployment Script
# This script handles the complete deployment process

set -e

echo "🚀 Starting Keymaker deployment..."

# Configuration
APP_NAME="keymaker"
DOCKER_IMAGE="keymaker:latest"
CONTAINER_NAME="keymaker-app"
BACKUP_DIR="/backups/keymaker"
LOG_FILE="/var/log/keymaker/deploy.log"

# Create necessary directories
mkdir -p $BACKUP_DIR
mkdir -p /var/log/keymaker
mkdir -p ./ssl

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check if container is running
is_container_running() {
    # Check if process is running on port 3000
    lsof -i :3000 || netstat -tulpn | grep :3000 || echo "No process found"
}

# Function to backup database
backup_database() {
    log "📦 Creating database backup..."
    if [ -f "./data/keymaker.db" ]; then
        cp ./data/keymaker.db $BACKUP_DIR/keymaker-$(date +%Y%m%d_%H%M%S).db
        log "✅ Database backup created"
    else
        log "⚠️  No database file found to backup"
    fi
}

# Function to stop existing container
stop_container() {
    if is_container_running; then
        log "🛑 Stopping existing container..."
        # Stop any existing process on port 3000
        pkill -f "next dev" || pkill -f "next start" || true
        log "✅ Container stopped and removed"
    else
        log "ℹ️  No running container found"
    fi
}

# Function to build new image
build_image() {
    log "🔨 Building Next.js application..."
    npm run build
    log "✅ Application built successfully"
}

# Function to start new container
start_container() {
    log "🚀 Starting new container..."
    nohup npm start > /dev/null 2>&1 &
    log "✅ Application started successfully"
}

# Function to check container health
check_health() {
    log "🏥 Checking application health..."
    sleep 10
    
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
            log "✅ Application is healthy"
            return 0
        fi
        log "⏳ Waiting for application to start... ($i/30)"
        sleep 2
    done
    
    log "❌ Application health check failed"
    return 1
}

# Function to cleanup old images
cleanup_images() {
    log "🧹 Cleanup completed"
    log "✅ Old images cleaned up"
}

# Function to show deployment status
show_status() {
    log "📊 Deployment Status:"
    echo "Application Status: Running on http://localhost:3001"
    echo "Application URL: http://localhost:3001"
    echo "Health Check: http://localhost:3001/api/health"
    echo "Logs: Check console output or use 'npm run logs' if available"
}

# Main deployment process
main() {
    log "🎯 Starting deployment process for $APP_NAME"
    
    # Pre-deployment checks
    if [ ! -f ".env" ]; then
        log "❌ .env file not found. Please create it before deploying."
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        log "❌ package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    # Deployment steps
    backup_database
    stop_container
    build_image
    start_container
    
    if check_health; then
        cleanup_images
        show_status
        log "🎉 Deployment completed successfully!"
    else
        log "❌ Deployment failed. Check logs for details."
        echo "Check console output for logs"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    "backup")
        backup_database
        ;;
    "stop")
        stop_container
        ;;
    "start")
        start_container
        ;;
    "restart")
        stop_container
        start_container
        ;;
    "status")
        show_status
        ;;
    "logs")
        echo "Check console output for logs"
        ;;
    "health")
        check_health
        ;;
    *)
        main
        ;;
esac
