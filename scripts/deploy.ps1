# Keymaker Production Deployment Script for Windows
# This script handles the complete deployment process

param(
    [string]$Action = "deploy"
)

# Configuration
$AppName = "keymaker"
$DockerImage = "keymaker:latest"
$ContainerName = "keymaker-app"
$BackupDir = ".\backups\keymaker"
$LogFile = ".\logs\deploy.log"

# Create necessary directories
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path ".\logs" | Out-Null
New-Item -ItemType Directory -Force -Path ".\ssl" | Out-Null

# Function to log messages
function Write-Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage
    Add-Content -Path $LogFile -Value $LogMessage
}

# Function to check if container is running
function Test-ContainerRunning {
    $Container = docker ps -q -f name=$ContainerName
    return $Container -ne $null -and $Container -ne ""
}

# Function to backup database
function Backup-Database {
    Write-Log "📦 Creating database backup..."
    if (Test-Path ".\data\keymaker.db") {
        $BackupFile = "$BackupDir\keymaker-$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
        Copy-Item ".\data\keymaker.db" $BackupFile
        Write-Log "✅ Database backup created: $BackupFile"
    } else {
        Write-Log "⚠️  No database file found to backup"
    }
}

# Function to stop existing container
function Stop-Container {
    if (Test-ContainerRunning) {
        Write-Log "🛑 Stopping existing container..."
        docker stop $ContainerName
        docker rm $ContainerName
        Write-Log "✅ Container stopped and removed"
    } else {
        Write-Log "ℹ️  No running container found"
    }
}

# Function to build new image
function Build-Image {
    Write-Log "🔨 Building Docker image..."
    docker build -t $DockerImage .
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Docker image built successfully"
    } else {
        Write-Log "❌ Docker image build failed"
        exit 1
    }
}

# Function to start new container
function Start-Container {
    Write-Log "🚀 Starting new container..."
    docker run -d `
        --name $ContainerName `
        --restart unless-stopped `
        -p 3000:3000 `
        --env-file .env `
        -v "${PWD}\data:/app/data" `
        -v "${PWD}\logs:/app/logs" `
        $DockerImage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✅ Container started successfully"
    } else {
        Write-Log "❌ Container start failed"
        exit 1
    }
}

# Function to check container health
function Test-Health {
    Write-Log "🏥 Checking container health..."
    Start-Sleep -Seconds 10
    
    for ($i = 1; $i -le 30; $i++) {
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -TimeoutSec 5 -ErrorAction Stop
            if ($Response.StatusCode -eq 200) {
                Write-Log "✅ Application is healthy"
                return $true
            }
        } catch {
            Write-Log "⏳ Waiting for application to start... ($i/30)"
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Log "❌ Application health check failed"
    return $false
}

# Function to cleanup old images
function Remove-OldImages {
    Write-Log "🧹 Cleaning up old Docker images..."
    docker image prune -f
    Write-Log "✅ Old images cleaned up"
}

# Function to show deployment status
function Show-Status {
    Write-Log "📊 Deployment Status:"
    docker ps -f name=$ContainerName --format "table {{.Status}}"
    Write-Host "Application URL: http://localhost:3000"
    Write-Host "Health Check: http://localhost:3000/api/health"
    Write-Host "Logs: docker logs $ContainerName"
}

# Main deployment process
function Start-Deployment {
    Write-Log "🎯 Starting deployment process for $AppName"
    
    # Pre-deployment checks
    if (-not (Test-Path ".env")) {
        Write-Log "❌ .env file not found. Please create it before deploying."
        exit 1
    }
    
    if (-not (Test-Path "package.json")) {
        Write-Log "❌ package.json not found. Are you in the correct directory?"
        exit 1
    }
    
    # Deployment steps
    Backup-Database
    Stop-Container
    Build-Image
    Start-Container
    
    if (Test-Health) {
        Remove-OldImages
        Show-Status
        Write-Log "🎉 Deployment completed successfully!"
    } else {
        Write-Log "❌ Deployment failed. Check logs for details."
        docker logs $ContainerName
        exit 1
    }
}

# Handle script arguments
switch ($Action.ToLower()) {
    "backup" {
        Backup-Database
    }
    "stop" {
        Stop-Container
    }
    "start" {
        Start-Container
    }
    "restart" {
        Stop-Container
        Start-Container
    }
    "status" {
        Show-Status
    }
    "logs" {
        docker logs -f $ContainerName
    }
    "health" {
        Test-Health
    }
    "deploy" {
        Start-Deployment
    }
    default {
        Write-Host "Usage: .\deploy.ps1 [action]"
        Write-Host "Actions: deploy, backup, stop, start, restart, status, logs, health"
        Write-Host "Default action: deploy"
    }
}
