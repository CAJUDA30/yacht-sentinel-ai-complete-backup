#!/bin/bash

# 🔄 SYSTEMATIC RESTORATION SCRIPT - Yacht Sentinel AI
# Automated restoration following systematic workflow preferences
# Created: October 11, 2025

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status "🚀 SYSTEMATIC RESTORATION SCRIPT STARTING"
echo "============================================="
echo "Following systematic workflow preferences for efficient restoration"
echo ""

# Check prerequisites
print_status "Step 1: Checking prerequisites..."

if ! command_exists docker; then
    print_error "Docker not found. Please install Docker Desktop."
    exit 1
fi

if ! command_exists supabase; then
    print_error "Supabase CLI not found. Please install Supabase CLI."
    exit 1
fi

if ! command_exists npm; then
    print_error "npm not found. Please install Node.js."
    exit 1
fi

print_success "All prerequisites found"

# Check Docker Desktop status
print_status "Step 2: Ensuring Docker Desktop is running..."

if ! docker info >/dev/null 2>&1; then
    print_warning "Docker Desktop not running. Attempting to start..."
    open -a "Docker Desktop" 2>/dev/null || true
    
    # Wait for Docker to start (max 60 seconds)
    for i in {1..12}; do
        if docker info >/dev/null 2>&1; then
            break
        fi
        print_status "Waiting for Docker Desktop to start... ($i/12)"
        sleep 5
    done
    
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker Desktop failed to start. Please start it manually."
        exit 1
    fi
fi

print_success "Docker Desktop is running"

# Clean up existing processes
print_status "Step 3: Cleaning up existing processes..."
pkill -f "vite|supabase" 2>/dev/null || true
print_success "Cleaned up existing processes"

# Stop existing Supabase
print_status "Step 4: Stopping existing Supabase instance..."
supabase stop 2>/dev/null || true
print_success "Stopped existing Supabase instance"

# Check if restoration backup exists
BACKUP_DIR="supabase_backups/complete_20251011_025727"
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_DIR"
    print_status "Available backups:"
    ls -la supabase_backups/ 2>/dev/null || echo "No backups found"
    exit 1
fi

# Restore Supabase from backup
print_status "Step 5: Restoring Supabase from comprehensive backup..."
cd "$BACKUP_DIR"

if [ ! -f "restore_complete_backup.sh" ]; then
    print_error "Restore script not found in backup directory"
    exit 1
fi

# Make restore script executable
chmod +x restore_complete_backup.sh

# Run restoration
print_status "Running comprehensive backup restoration..."
./restore_complete_backup.sh

cd ../..
print_success "Supabase restoration completed"

# Start Supabase
print_status "Step 6: Starting Supabase development environment..."
supabase start

# Wait for Supabase to be fully ready
print_status "Waiting for Supabase to be fully ready..."
sleep 10

# Check Supabase status
if supabase status >/dev/null 2>&1; then
    print_success "Supabase is running successfully"
    supabase status
else
    print_warning "Supabase status check failed, but continuing..."
fi

# Install/update npm dependencies
print_status "Step 7: Installing/updating npm dependencies..."
npm install
print_success "npm dependencies installed"

# Start development server
print_status "Step 8: Starting React development server..."
print_status "This will start the server in the background..."

# Start npm dev in background
npm run dev &
DEV_PID=$!

# Wait a moment for server to start
sleep 5

# Check if server started successfully
if kill -0 $DEV_PID 2>/dev/null; then
    print_success "React development server started successfully (PID: $DEV_PID)"
    echo ""
    echo "🎉 SYSTEMATIC RESTORATION COMPLETED SUCCESSFULLY!"
    echo "============================================="
    echo ""
    echo "📱 APPLICATION URLS:"
    echo "   Main App: http://localhost:5173/"
    echo "   Supabase Studio: http://127.0.0.1:54323"
    echo ""
    echo "🔐 AUTHENTICATION VERIFICATION:"
    echo "   1. Visit http://localhost:5173/ (should redirect to /auth)"
    echo "   2. Login as: superadmin@yachtexcel.com"
    echo "   3. Verify role persistence across page refreshes"
    echo ""
    echo "🛠️ DEVELOPMENT SERVER:"
    echo "   - Running in background (PID: $DEV_PID)"
    echo "   - To stop: kill $DEV_PID"
    echo "   - To restart: npm run dev"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "   1. Open browser to http://localhost:5173/"
    echo "   2. Test authentication system"
    echo "   3. Verify superadmin role persistence"
    echo "   4. Check all critical functionality"
    echo ""
    print_success "System restored following systematic workflow preferences"
    
    # Save PID for easy killing later
    echo $DEV_PID > .dev_server_pid
    echo "Development server PID saved to .dev_server_pid"
    
else
    print_error "React development server failed to start"
    exit 1
fi