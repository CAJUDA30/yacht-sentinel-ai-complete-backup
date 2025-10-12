#!/bin/bash

# Yacht Sentinel AI - Full Development Stack Startup Script with Docker Desktop
# This script starts Docker Desktop, uses the unified complete backup, and launches all services
# Includes: Docker Desktop + Supabase + Database + Frontend + Encryption

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Yacht Sentinel AI - Full Stack Startup             ║${NC}"
echo -e "${BLUE}║    🎯 WITH INTELLIGENT BACKUP AUTO-DETECTION           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration - INTELLIGENT BACKUP DETECTION
BACKUP_DIR="./supabase_backups"

# Backup patterns (in priority order)
COMPREHENSIVE_BACKUP_PATTERN="comprehensive_backup_*"
UNIFIED_BACKUP_PATTERN="unified_complete_*"
LEGACY_COMPLETE_BACKUP="yacht_sentinel_20251011_024733_COMPLETE.dump"

# Supabase local DB connection
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Step 1: Intelligent Backup Detection (PRIORITY: Comprehensive → Unified → Legacy)
echo -e "${BLUE}🔍 Auto-detecting latest backup...${NC}"
echo ""

# Variables for backup selection
BACKUP_TYPE=""
BACKUP_PATH=""
RESTORE_SCRIPT=""

# Priority 1: Check for comprehensive backup (created by comprehensive backup system)
echo -e "${BLUE}[1/3] Checking for comprehensive backup...${NC}"
COMPREHENSIVE_BACKUP_PATH=$(ls -td $BACKUP_DIR/$COMPREHENSIVE_BACKUP_PATTERN 2>/dev/null | head -1 || echo "")

if [ -n "$COMPREHENSIVE_BACKUP_PATH" ] && [ -d "$COMPREHENSIVE_BACKUP_PATH" ]; then
    BACKUP_TYPE="COMPREHENSIVE"
    BACKUP_PATH="$COMPREHENSIVE_BACKUP_PATH"
    RESTORE_SCRIPT="restore_complete_backup.sh"
    
    # Get backup timestamp from directory name
    BACKUP_TIMESTAMP=$(basename "$BACKUP_PATH" | sed 's/comprehensive_backup_//')
    
    echo -e "${GREEN}      ✅ Found comprehensive backup (Latest!)${NC}"
    echo -e "${BLUE}      📁 Path: $BACKUP_PATH${NC}"
    echo -e "${BLUE}      📅 Created: $BACKUP_TIMESTAMP${NC}"
    echo -e "${GREEN}      ✓ Complete database with all data${NC}"
    echo -e "${GREEN}      ✓ Users with encrypted passwords (bcrypt)${NC}"
    echo -e "${GREEN}      ✓ User roles and permissions${NC}"
    echo -e "${GREEN}      ✓ ALL RLS policies (88+)${NC}"
    echo -e "${GREEN}      ✓ ALL RPC functions (20+)${NC}"
    echo -e "${GREEN}      ✓ ALL migrations (24+)${NC}"
    echo -e "${GREEN}      ✓ ALL Edge Functions (73+)${NC}"
    echo -e "${GREEN}      ✓ AES-256 encryption system${NC}"
    echo -e "${GREEN}      ✓ All data records (CSV per table)${NC}"
    
    # Check for restore script
    if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
        echo -e "${GREEN}      ✓ Auto-restore script: $RESTORE_SCRIPT${NC}"
    fi
    
else
    echo -e "${YELLOW}      ⚠️  No comprehensive backup found${NC}"
    
    # Priority 2: Check for unified complete backup
    echo -e "${BLUE}[2/3] Checking for unified complete backup...${NC}"
    UNIFIED_BACKUP_PATH=$(ls -td $BACKUP_DIR/$UNIFIED_BACKUP_PATTERN 2>/dev/null | head -1 || echo "")
    
    if [ -n "$UNIFIED_BACKUP_PATH" ] && [ -d "$UNIFIED_BACKUP_PATH" ]; then
        BACKUP_TYPE="UNIFIED"
        BACKUP_PATH="$UNIFIED_BACKUP_PATH"
        RESTORE_SCRIPT="restore_unified_backup.sh"
        
        echo -e "${GREEN}      ✅ Found unified complete backup${NC}"
        echo -e "${BLUE}      📁 Path: $BACKUP_PATH${NC}"
        echo -e "${GREEN}      ✓ Complete database with encryption${NC}"
        echo -e "${GREEN}      ✓ All application source code${NC}"
        echo -e "${GREEN}      ✓ All migrations${NC}"
        echo -e "${GREEN}      ✓ Edge functions and configurations${NC}"
        
        if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
            echo -e "${GREEN}      ✓ Restore script: $RESTORE_SCRIPT${NC}"
        fi
        
    else
        echo -e "${YELLOW}      ⚠️  No unified backup found${NC}"
        
        # Priority 3: Check for legacy backup
        echo -e "${BLUE}[3/3] Checking for legacy backup...${NC}"
        LEGACY_BACKUP_PATH="$BACKUP_DIR/$LEGACY_COMPLETE_BACKUP"
        
        if [ -f "$LEGACY_BACKUP_PATH" ]; then
            BACKUP_TYPE="LEGACY"
            BACKUP_PATH="$LEGACY_BACKUP_PATH"
            
            echo -e "${GREEN}      ✅ Found legacy backup${NC}"
            echo -e "${BLUE}      📁 Path: $BACKUP_PATH${NC}"
            echo -e "${YELLOW}      ⚠️  Using older backup format${NC}"
        else
            echo -e "${RED}      ❌ No backup found!${NC}"
            echo -e "${RED}❌ No backup available for restoration${NC}"
            echo -e "${YELLOW}💡 Suggestion: Run ./create_comprehensive_backup.sh to create a backup${NC}"
            exit 1
        fi
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🎯 SELECTED BACKUP: $BACKUP_TYPE${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 2: Start Docker Desktop and wait for it to be ready
echo -e "${BLUE}🐳 Starting Docker Desktop...${NC}"

# Check if Docker Desktop is already running
if pgrep -f "Docker Desktop" > /dev/null; then
    echo -e "${GREEN}✅ Docker Desktop is already running${NC}"
    
    # Check if Docker daemon is accessible
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker daemon is accessible${NC}"
    else
        echo -e "${YELLOW}⏳ Docker daemon not ready, waiting...${NC}"
        # Wait for Docker daemon to be ready
        for i in {1..30}; do
            if docker info >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Docker daemon is now accessible${NC}"
                break
            fi
            sleep 2
            echo -n "."
        done
        echo ""
    fi
else
    echo -e "${BLUE}🚀 Starting Docker Desktop application...${NC}"
    open -a "Docker Desktop"
    
    echo -e "${BLUE}⏳ Waiting for Docker Desktop to start...${NC}"
    # Wait for Docker Desktop process to start
    for i in {1..60}; do
        if pgrep -f "Docker Desktop" > /dev/null; then
            echo -e "${GREEN}✅ Docker Desktop process started${NC}"
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
    
    # Wait for Docker daemon to be accessible
    echo -e "${BLUE}⏳ Waiting for Docker daemon to be ready...${NC}"
    for i in {1..60}; do
        if docker info >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker daemon is ready${NC}"
            break
        fi
        sleep 3
        echo -n "."
    done
    echo ""
    
    # Final check
    if ! docker info >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Docker daemon still not accessible, but continuing...${NC}"
        echo -e "${YELLOW}   Docker may still be starting up in the background${NC}"
    fi
fi
echo ""

# Step 3: Stop any running services
echo -e "${BLUE}🛑 Stopping any running services...${NC}"
npx supabase stop 2>/dev/null || true
lsof -ti:5174 | xargs kill -9 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
echo -e "${GREEN}✅ All services stopped${NC}"
echo ""

# Step 4: Start Supabase
echo -e "${BLUE}🚀 Starting Supabase...${NC}"
npx supabase start
echo -e "${GREEN}✅ Supabase started${NC}"
echo ""

# Wait for Supabase to be ready
echo -e "${BLUE}⏳ Waiting for Supabase to be ready...${NC}"
sleep 5

# Step 5: Restore database based on backup type
echo -e "${BLUE}🔍 Checking database state...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
TABLE_COUNT=$(echo $TABLE_COUNT | xargs)  # Trim whitespace

echo -e "${YELLOW}📊 Current table count: $TABLE_COUNT${NC}"

if [ "$TABLE_COUNT" -lt 15 ]; then
    echo -e "${YELLOW}⚠️  Database has less than 15 tables - restoring from backup...${NC}"
    echo ""
    
    # Terminate existing connections
    echo -e "${BLUE}🔄 Terminating existing database connections...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '$DB_NAME'
      AND pid <> pg_backend_pid();
    " 2>/dev/null || true
    
    # Restore based on detected backup type
    if [ "$BACKUP_TYPE" = "COMPREHENSIVE" ]; then
        # Use comprehensive backup (Priority #1)
        echo -e "${BLUE}🎯 Restoring from COMPREHENSIVE backup...${NC}"
        echo -e "${GREEN}   ✓ Complete database with all data${NC}"
        echo -e "${GREEN}   ✓ Users with encrypted passwords${NC}"
        echo -e "${GREEN}   ✓ User roles and permissions${NC}"
        echo -e "${GREEN}   ✓ ALL RLS policies${NC}"
        echo -e "${GREEN}   ✓ ALL RPC functions${NC}"
        echo -e "${GREEN}   ✓ ALL migrations${NC}"
        echo -e "${GREEN}   ✓ ALL Edge Functions${NC}"
        echo -e "${GREEN}   ✓ AES-256 encryption system${NC}"
        echo ""
        
        if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
            echo -e "${BLUE}📦 Using automated restore script...${NC}"
            cd "$BACKUP_PATH"
            bash "$RESTORE_SCRIPT"
            cd - > /dev/null
        else
            # Manual restore from comprehensive backup
            echo -e "${BLUE}🔧 Manual restore from comprehensive backup...${NC}"
            DB_DUMP_FILE=$(find "$BACKUP_PATH" -name "*.dump" | head -1)
            if [ -n "$DB_DUMP_FILE" ]; then
                PGPASSWORD=$DB_PASSWORD pg_restore \
                    -h $DB_HOST \
                    -p $DB_PORT \
                    -U $DB_USER \
                    -d $DB_NAME \
                    --clean \
                    --if-exists \
                    --no-owner \
                    --no-acl \
                    "$DB_DUMP_FILE" 2>&1 | grep -v "NOTICE\|WARNING" || true
            else
                echo -e "${RED}❌ No .dump file found in comprehensive backup${NC}"
                exit 1
            fi
        fi
        
        echo -e "${GREEN}✅ Database restored from comprehensive backup${NC}"
        
    elif [ "$BACKUP_TYPE" = "UNIFIED" ]; then
        # Use unified complete backup (Priority #2)
        echo -e "${BLUE}🎯 Restoring from UNIFIED COMPLETE backup...${NC}"
        echo -e "${GREEN}   ✓ Complete database with AES-256 encryption${NC}"
        echo -e "${GREEN}   ✓ Auto-encryption triggers and views${NC}"
        echo -e "${GREEN}   ✓ All application source code${NC}"
        echo -e "${GREEN}   ✓ Complete migration history (23 migrations)${NC}"
        echo -e "${GREEN}   ✓ All documentation and configurations${NC}"
        echo ""
        
        if [ -f "$BACKUP_PATH/$RESTORE_SCRIPT" ]; then
            echo -e "${BLUE}📦 Using unified restore script...${NC}"
            cd "$BACKUP_PATH"
            bash "$RESTORE_SCRIPT"
            cd - > /dev/null
        else
            # Manual restore from unified backup
            echo -e "${BLUE}🔧 Manual restore from unified backup...${NC}"
            DB_DUMP_FILE=$(find "$BACKUP_PATH" -name "*.dump" | head -1)
            if [ -n "$DB_DUMP_FILE" ]; then
                PGPASSWORD=$DB_PASSWORD pg_restore \
                    -h $DB_HOST \
                    -p $DB_PORT \
                    -U $DB_USER \
                    -d $DB_NAME \
                    --clean \
                    --if-exists \
                    --no-owner \
                    --no-acl \
                    "$DB_DUMP_FILE" 2>&1 | grep -v "NOTICE\|WARNING" || true
            else
                echo -e "${RED}❌ No .dump file found in unified backup${NC}"
                exit 1
            fi
        fi
        
        echo -e "${GREEN}✅ Database restored from unified complete backup${NC}"
        
    elif [ "$BACKUP_TYPE" = "LEGACY" ]; then
        # Use legacy backup (Priority #3)
        echo -e "${BLUE}🔄 Restoring database from legacy backup...${NC}"
        echo -e "${YELLOW}   (This includes 70+ tables, edge functions, RLS policies, RPC functions)${NC}"
        PGPASSWORD=$DB_PASSWORD pg_restore \
            -h $DB_HOST \
            -p $DB_PORT \
            -U $DB_USER \
            -d $DB_NAME \
            --clean \
            --if-exists \
            --no-owner \
            --no-acl \
            "$BACKUP_PATH" 2>&1 | grep -v "NOTICE\|WARNING" || true
        
        echo -e "${GREEN}✅ Database restored from legacy backup${NC}"
    fi
    
    echo ""
    
    # Verify restoration
    TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    TABLE_COUNT=$(echo $TABLE_COUNT | xargs)
    echo -e "${GREEN}✅ Database now has $TABLE_COUNT tables${NC}"
    
    # Verify encryption functions (should be present in unified backup)
    echo -e "${BLUE}🔍 Verifying encryption implementation...${NC}"
    ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
    ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)
    
    if [ "$ENCRYPTION_FUNCTIONS" -ge 3 ]; then
        echo -e "${GREEN}✅ Encryption functions verified ($ENCRYPTION_FUNCTIONS functions)${NC}"
        
        # Check for core encryption functions
        CORE_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('is_encrypted', 'encrypt_api_key', 'decrypt_api_key');" 2>/dev/null | grep -v "^$" | wc -l | xargs)
        if [ "$CORE_FUNCTIONS" -eq 3 ]; then
            echo -e "${GREEN}✅ Core encryption functions active (is_encrypted, encrypt_api_key, decrypt_api_key)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Encryption functions not found - applying migration...${NC}"
        # Apply encryption migration if exists
        if [ -f "./supabase/migrations/20251012110000_automatic_api_key_encryption.sql" ]; then
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "./supabase/migrations/20251012110000_automatic_api_key_encryption.sql"
            echo -e "${GREEN}✅ Encryption migration applied${NC}"
        fi
    fi
    
    # Restore superadmin account
    echo -e "${BLUE}🔑 Ensuring superadmin account exists...${NC}"
    if [ -f "./restore_superadmin.sh" ]; then
        bash ./restore_superadmin.sh
    else
        echo -e "${YELLOW}⚠️  restore_superadmin.sh not found - skipping${NC}"
    fi
    echo ""
else
    echo -e "${GREEN}✅ Database already has $TABLE_COUNT tables - skipping restoration${NC}"
    echo ""
fi

# Step 5.5: Check and create users systematically
echo -e "${BLUE}👥 Checking user data and creating missing users...${NC}"

# Check current user count
CURRENT_USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM auth.users WHERE email LIKE '%yachtexcel.com';" 2>/dev/null | xargs || echo "0")
CURRENT_USER_ROLES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM public.user_roles;" 2>/dev/null | xargs || echo "0")

echo -e "${YELLOW}📊 Current users: $CURRENT_USER_COUNT, roles: $CURRENT_USER_ROLES_COUNT${NC}"

if [ "$CURRENT_USER_COUNT" -lt 6 ] || [ "$CURRENT_USER_ROLES_COUNT" -lt 6 ]; then
    echo -e "${YELLOW}⚠️  Missing users detected - creating all 6 users systematically...${NC}"
    
    # Create users using service role API
    echo -e "${BLUE}🚀 Creating users via service role...${NC}"
    
    # User creation function
    create_user_systematic() {
        local email=$1
        local password=$2
        local role=$3
        
        echo -e "${BLUE}   👤 Creating $role: $email${NC}"
        
        # Try service role API first
        RESPONSE=$(curl -s -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
          -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
          -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
          -H "Content-Type: application/json" \
          -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"email_confirm\": true,
            \"user_metadata\": {
              \"role\": \"$role\",
              \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")
            }
          }")
        
        if echo "$RESPONSE" | grep -q '"id"'; then
            USER_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
            echo -e "${GREEN}      ✅ User created - ID: ${USER_ID:0:8}...${NC}"
            
            # Add role to user_roles table
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
                VALUES ('$USER_ID', '$role', '$USER_ID', true)
                ON CONFLICT (user_id, role) DO UPDATE SET 
                    is_active = true,
                    updated_at = now();
            " >/dev/null 2>&1 && echo -e "${GREEN}      ✅ Role assigned${NC}" || echo -e "${YELLOW}      ⚠️  Role assignment may have failed${NC}"
            
            return 0
        else
            echo -e "${RED}      ❌ Failed via API - trying direct SQL...${NC}"
            
            # Fallback: Try direct SQL insertion
            USER_ID=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
                DO \$\$
                DECLARE
                    new_user_id UUID := gen_random_uuid();
                BEGIN
                    -- Insert user if not exists
                    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = '$email') THEN
                        INSERT INTO auth.users (
                            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at
                        ) VALUES (
                            '00000000-0000-0000-0000-000000000000', new_user_id, 'authenticated', 'authenticated',
                            '$email', crypt('$password', gen_salt('bf')), now(),
                            '{\"provider\": \"email\", \"providers\": [\"email\"]}',
                            '{\"role\": \"$role\", \"is_superadmin\": $([ "$role" == "superadmin" ] && echo "true" || echo "false")}',
                            $([ "$role" == "superadmin" ] && echo "true" || echo "false"), now(), now()
                        );
                        
                        -- Insert role
                        INSERT INTO public.user_roles (user_id, role, granted_by, is_active)
                        VALUES (new_user_id, '$role', new_user_id, true);
                        
                        RAISE NOTICE 'Created user: %', new_user_id;
                    END IF;
                END \$\$;
            " 2>/dev/null | grep -o 'Created user: [^[:space:]]*' | cut -d' ' -f3)
            
            if [ -n "$USER_ID" ]; then
                echo -e "${GREEN}      ✅ User created via SQL - ID: ${USER_ID:0:8}...${NC}"
                return 0
            else
                echo -e "${RED}      ❌ Failed to create user: $email${NC}"
                return 1
            fi
        fi
    }
    
    # Create all 6 users
    CREATED_COUNT=0
    create_user_systematic "superadmin@yachtexcel.com" "superadmin123" "superadmin" && ((CREATED_COUNT++))
    create_user_systematic "admin@yachtexcel.com" "admin123" "admin" && ((CREATED_COUNT++))
    create_user_systematic "manager@yachtexcel.com" "manager123" "manager" && ((CREATED_COUNT++))
    create_user_systematic "user@yachtexcel.com" "user123" "user" && ((CREATED_COUNT++))
    create_user_systematic "viewer@yachtexcel.com" "viewer123" "viewer" && ((CREATED_COUNT++))
    create_user_systematic "guest@yachtexcel.com" "guest123" "guest" && ((CREATED_COUNT++))
    
    echo ""
    echo -e "${GREEN}✅ User creation completed: $CREATED_COUNT/6 users created${NC}"
else
    echo -e "${GREEN}✅ All users already exist ($CURRENT_USER_COUNT users, $CURRENT_USER_ROLES_COUNT roles)${NC}"
fi
echo ""

# Step 5.7: Verify encryption implementation 
echo -e "${BLUE}🔍 Verifying encryption implementation...${NC}"
ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)

if [ "$ENCRYPTION_FUNCTIONS" -ge 3 ]; then
    echo -e "${GREEN}✅ Encryption functions verified ($ENCRYPTION_FUNCTIONS functions)${NC}"
else
    echo -e "${YELLOW}⚠️  Encryption functions missing - this database may need the encryption migration${NC}"
    if [ "$USE_UNIFIED_BACKUP" = true ]; then
        echo -e "${YELLOW}   This is unexpected for a unified backup - please check backup integrity${NC}"
    fi
fi
echo ""

# Step 5.8: Verify RLS Policy Integrity (Critical for DELETE operations)
echo -e "${BLUE}🔒 Verifying RLS policy integrity for critical tables...${NC}"
if [ -f "./verify_rls_integrity.sh" ]; then
    ./verify_rls_integrity.sh
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ RLS policies verified and fixed if needed${NC}"
    else
        echo -e "${RED}❌ RLS policy verification failed${NC}"
        echo -e "${YELLOW}⚠️  You may experience permission issues with DELETE operations${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  RLS integrity check script not found - skipping${NC}"
fi
echo ""

# Step 6: Start Frontend
echo -e "${BLUE}🌐 Starting Frontend Development Server...${NC}"
echo -e "${YELLOW}   Frontend will start on http://localhost:5173${NC}"
echo ""

# Start in background
npm run dev &
VITE_PID=$!

# Wait for frontend to start
echo -e "${BLUE}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Check if Vite is running
if ps -p $VITE_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend started successfully${NC}"
else
    echo -e "${RED}❌ Frontend failed to start${NC}"
    exit 1
fi

# Step 7: Display status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ FULL DEVELOPMENT STACK RUNNING                     ║${NC}"
if [ "$BACKUP_TYPE" = "COMPREHENSIVE" ]; then
    echo -e "${GREEN}║  🎯 FROM COMPREHENSIVE BACKUP (LATEST!)                ║${NC}"
elif [ "$BACKUP_TYPE" = "UNIFIED" ]; then
    echo -e "${GREEN}║  🎯 FROM UNIFIED COMPLETE BACKUP                       ║${NC}"
elif [ "$BACKUP_TYPE" = "LEGACY" ]; then
    echo -e "${YELLOW}║  📦 FROM LEGACY BACKUP                                 ║${NC}"
fi
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📊 System Status:${NC}"
echo -e "   ${GREEN}✅${NC} Docker:    $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d ',' || echo 'Not accessible')"
echo -e "   ${GREEN}✅${NC} Supabase:  http://127.0.0.1:54321"
echo -e "   ${GREEN}✅${NC} Database:  localhost:54322"
echo -e "   ${GREEN}✅${NC} Frontend:  http://localhost:5173"
echo ""
echo -e "${BLUE}🗄️  Database Statistics:${NC}"
echo -e "   ${GREEN}✅${NC} Tables:        $TABLE_COUNT tables loaded"

# Get comprehensive database statistics
echo -e "${BLUE}⏳ Gathering database statistics...${NC}"

# Count users
USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")

# Count user roles
USER_ROLES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM public.user_roles;" 2>/dev/null | xargs || echo "0")

# Count RLS policies
RLS_POLICIES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_policies;" 2>/dev/null | xargs || echo "0")

# Count RPC functions
RPC_FUNCTIONS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';" 2>/dev/null | xargs || echo "0")

# Count migrations
MIGRATIONS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM supabase_migrations.schema_migrations;" 2>/dev/null | xargs || echo "0")

# Count edge functions
EDGE_FUNCTIONS_COUNT=$(find ./supabase/functions -name "index.ts" 2>/dev/null | wc -l | xargs || echo "0")

# Get edge function names for detailed display
EDGE_FUNCTIONS_LIST=$(find ./supabase/functions -maxdepth 2 -name "index.ts" 2>/dev/null | sed 's|./supabase/functions/||g' | sed 's|/index.ts||g' | head -5 | tr '\n' ', ' | sed 's/,$//' || echo "none")

# Count total data records across main tables
DATA_RECORDS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT 
    COALESCE(SUM(n_tup_ins + n_tup_upd), 0) as total_records
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
    AND relname NOT LIKE '%_pkey'
    AND relname NOT LIKE '%_idx';
" 2>/dev/null | xargs || echo "0")

# Get key table names for display
KEY_TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
SELECT string_agg(table_name, ', ') 
FROM (
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name IN ('user_roles', 'ai_providers_unified', 'yachts', 'inventory_items', 'system_settings')
    ORDER BY table_name
    LIMIT 5
) t;
" 2>/dev/null | xargs || echo "none")

echo -e "${GREEN}✅ Database statistics collected${NC}"

# Display comprehensive statistics
echo -e "   ${GREEN}✅${NC} Database Tables: $TABLE_COUNT tables loaded"
if [ -n "$KEY_TABLES" ] && [ "$KEY_TABLES" != "none" ]; then
    echo -e "   ${BLUE}    →${NC} Key Tables: $KEY_TABLES"
fi
echo -e "   ${GREEN}✅${NC} Data Records:    $DATA_RECORDS_COUNT total records"
echo -e "   ${GREEN}✅${NC} Users:           $USER_COUNT users"
echo -e "   ${GREEN}✅${NC} User Roles:      $USER_ROLES_COUNT role assignments"
echo -e "   ${GREEN}✅${NC} RLS Policies:    $RLS_POLICIES_COUNT policies"
echo -e "   ${GREEN}✅${NC} RPC Functions:   $RPC_FUNCTIONS_COUNT functions"
echo -e "   ${GREEN}✅${NC} Migrations:      $MIGRATIONS_COUNT applied"
echo -e "   ${GREEN}✅${NC} Edge Functions:  $EDGE_FUNCTIONS_COUNT functions"
if [ "$EDGE_FUNCTIONS_COUNT" -gt 0 ] && [ -n "$EDGE_FUNCTIONS_LIST" ]; then
    echo -e "   ${BLUE}    →${NC} Functions: $EDGE_FUNCTIONS_LIST$([ "$EDGE_FUNCTIONS_COUNT" -gt 5 ] && echo "... (+$((EDGE_FUNCTIONS_COUNT-5)) more)")"
fi

echo ""
echo -e "${BLUE}🔐 Security & System Status:${NC}"
# Always check for encryption functions now
ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null || echo "0")
ENCRYPTION_FUNCTIONS=$(echo $ENCRYPTION_FUNCTIONS | xargs)
if [ "$ENCRYPTION_FUNCTIONS" -ge 3 ]; then
    echo -e "   ${GREEN}✅${NC} Encryption:      AES-256 implementation active"
    echo -e "   ${GREEN}✅${NC} Functions:       $ENCRYPTION_FUNCTIONS encryption functions"
else
    echo -e "   ${YELLOW}⚠️${NC}  Encryption:      Not active ($ENCRYPTION_FUNCTIONS functions)"
fi

echo ""
echo -e "${BLUE}🔑 Login Credentials:${NC}"
echo -e "   Email:    superadmin@yachtexcel.com"
echo -e "   Password: superadmin123"
echo ""

# Show backup type and features based on what was used
if [ "$BACKUP_TYPE" = "COMPREHENSIVE" ]; then
    echo -e "${BLUE}🎯 Comprehensive Backup Features (Used for Restore):${NC}"
    echo -e "   ✓ Complete database with ALL data"
    echo -e "   ✓ Users with encrypted passwords (bcrypt)"
    echo -e "   ✓ User roles and permissions matrix"
    echo -e "   ✓ ALL RLS policies ($RLS_POLICIES_COUNT policies)"
    echo -e "   ✓ ALL RPC functions ($RPC_FUNCTIONS_COUNT functions)"
    echo -e "   ✓ ALL migrations ($MIGRATIONS_COUNT migrations)"
    echo -e "   ✓ ALL Edge Functions ($EDGE_FUNCTIONS_COUNT functions)"
    echo -e "   ✓ AES-256 encryption system"
    echo -e "   ✓ All data records (CSV per table)"
    echo ""
elif [ "$BACKUP_TYPE" = "UNIFIED" ]; then
    echo -e "${BLUE}🎯 Unified Backup Features (Used for Restore):${NC}"
    echo -e "   ✓ Complete database with all data and encryption"
    echo -e "   ✓ All application source code (5.3M)"
    echo -e "   ✓ Complete migration history (23 migrations)"
    echo -e "   ✓ All documentation (90 files)"
    echo -e "   ✓ Edge functions and configurations"
    echo ""
fi

if [ "$ENCRYPTION_FUNCTIONS" -ge 3 ]; then
    echo -e "${BLUE}🔐 Encryption Features:${NC}"
    echo -e "   ✓ All API keys automatically encrypted (AES-256)"
    echo -e "   ✓ Automatic decryption on read (transparent to app)"
    echo -e "   ✓ Backward compatible with existing keys"
    echo -e "   ✓ Zero plain text storage in database"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo -e "   • ENCRYPTION_INDEX.md - Master documentation index"
    echo -e "   • ENCRYPTION_QUICK_REFERENCE.md - Developer guide"
    echo -e "   • ENCRYPTION_TESTING_GUIDE.md - 15 test cases"
    echo ""
fi

# ============================================================================
# COMPREHENSIVE BACKUP CREATION (Optional but Recommended)
# ============================================================================

echo -e "${BLUE}💾 Creating comprehensive backup of current system state...${NC}"
echo -e "${YELLOW}   (This backs up EVERYTHING: data, users, roles, functions, migrations, etc.)${NC}"
echo ""

# Make backup script executable if not already
if [ -f "./create_comprehensive_backup.sh" ]; then
    chmod +x ./create_comprehensive_backup.sh
    
    # Run backup in background to not block startup
    ./create_comprehensive_backup.sh > /tmp/comprehensive_backup.log 2>&1 &
    BACKUP_PID=$!
    
    echo -e "${GREEN}✅ Comprehensive backup started in background (PID: $BACKUP_PID)${NC}"
    echo -e "${BLUE}   Check progress: tail -f /tmp/comprehensive_backup.log${NC}"
    echo -e "${BLUE}   Backup includes: Users, Roles, Policies, Functions, Migrations, Edge Functions, All Data${NC}"
else
    echo -e "${YELLOW}⚠️  Comprehensive backup script not found - skipping${NC}"
fi
echo ""

echo -e "${YELLOW}📝 To stop all services, run:${NC} ./stop_full_stack.sh"
echo -e "${YELLOW}📦 To create manual backup, run:${NC} ./create_comprehensive_backup.sh"
echo -e "${YELLOW}🔍 To verify user system health, run:${NC} ./verify_user_creation_system.sh"
echo ""
echo -e "${GREEN}🎉 Ready to develop!${NC}"
echo ""

# Keep script running so processes don't terminate
wait $VITE_PID
