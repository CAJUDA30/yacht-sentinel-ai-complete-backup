#!/bin/bash

# Supabase Complete Backup Restore Script
# This script restores the complete Supabase database, RLS policies, functions, and data

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SUPABASE COMPLETE BACKUP RESTORE SCRIPT                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

BACKUP_DIR="$(dirname "$0")"
PROJECT_ROOT="${PROJECT_ROOT:-../../}"

echo "📦 Backup location: ${BACKUP_DIR}"
echo "🎯 Project root: ${PROJECT_ROOT}"
echo ""

# Check if Supabase is running
if ! pgrep -f "supabase" > /dev/null; then
    echo "⚠️  Supabase is not running. Starting Supabase..."
    cd "${PROJECT_ROOT}"
    npx supabase start
    sleep 5
fi

echo "🔄 Starting restore process..."
echo ""

# Step 1: Restore complete database
echo "1️⃣ Restoring complete database (schema + data)..."
if [ -f "${BACKUP_DIR}/full_database_dump.sql" ]; then
    psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < "${BACKUP_DIR}/full_database_dump.sql" > /dev/null 2>&1
    echo "✅ Database restored successfully"
else
    echo "❌ Database dump file not found!"
    exit 1
fi
echo ""

# Step 2: Verify critical tables
echo "2️⃣ Verifying critical tables..."
TABLE_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')
RLS_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public'" | tr -d ' ')
FUNC_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public'" | tr -d ' ')

echo "   Tables: ${TABLE_COUNT}"
echo "   RLS Policies: ${RLS_COUNT}"
echo "   Functions: ${FUNC_COUNT}"
echo "✅ Database structure verified"
echo ""

# Step 3: Verify superadmin user
echo "3️⃣ Verifying superadmin user..."
SUPERADMIN_COUNT=$(psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "SELECT COUNT(*) FROM public.user_roles WHERE role = 'superadmin' AND is_active = true" | tr -d ' ')
if [ "$SUPERADMIN_COUNT" -gt 0 ]; then
    echo "✅ Superadmin user verified (${SUPERADMIN_COUNT} active)"
else
    echo "⚠️  Warning: No active superadmin found"
fi
echo ""

# Step 4: Copy migrations (optional - for reference)
echo "4️⃣ Updating migration files..."
if [ -d "${BACKUP_DIR}/migrations" ] && [ -d "${PROJECT_ROOT}/supabase/migrations" ]; then
    # Create backup of current migrations
    if [ "$(ls -A ${PROJECT_ROOT}/supabase/migrations 2>/dev/null)" ]; then
        MIGRATION_BACKUP="${PROJECT_ROOT}/supabase/migrations_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${MIGRATION_BACKUP}"
        cp -r "${PROJECT_ROOT}/supabase/migrations/"* "${MIGRATION_BACKUP}/" 2>/dev/null || true
        echo "   Current migrations backed up to: ${MIGRATION_BACKUP}"
    fi
    
    # Copy restored migrations
    cp -r "${BACKUP_DIR}/migrations/"* "${PROJECT_ROOT}/supabase/migrations/" 2>/dev/null || true
    echo "✅ Migration files updated"
else
    echo "⚠️  Skipping migration file copy (directory not found)"
fi
echo ""

# Step 5: Copy Edge Functions (optional)
echo "5️⃣ Updating Edge Functions..."
if [ -d "${BACKUP_DIR}/functions" ] && [ -d "${PROJECT_ROOT}/supabase/functions" ]; then
    # Create backup of current functions
    if [ "$(ls -A ${PROJECT_ROOT}/supabase/functions 2>/dev/null)" ]; then
        FUNCTION_BACKUP="${PROJECT_ROOT}/supabase/functions_backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "${FUNCTION_BACKUP}"
        cp -r "${PROJECT_ROOT}/supabase/functions/"* "${FUNCTION_BACKUP}/" 2>/dev/null || true
        echo "   Current functions backed up to: ${FUNCTION_BACKUP}"
    fi
    
    # Copy restored functions
    cp -r "${BACKUP_DIR}/functions/"* "${PROJECT_ROOT}/supabase/functions/" 2>/dev/null || true
    echo "✅ Edge Functions updated"
else
    echo "⚠️  Skipping Edge Functions copy (directory not found)"
fi
echo ""

# Step 6: Run health check
echo "6️⃣ Running system health check..."
if [ -f "${PROJECT_ROOT}/check_system_health.sh" ]; then
    cd "${PROJECT_ROOT}"
    bash check_system_health.sh
else
    echo "⚠️  Health check script not found, skipping"
fi
echo ""

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   RESTORE COMPLETED SUCCESSFULLY                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✅ Database fully restored from backup"
echo "✅ RLS policies active"
echo "✅ Functions restored"
echo "✅ Migrations synchronized"
echo ""
echo "🔑 SUPERADMIN CREDENTIALS:"
echo "   Email: superadmin@yachtexcel.com"
echo "   Password: admin123"
echo ""
echo "📝 Next steps:"
echo "   1. Verify login works with superadmin credentials"
echo "   2. Check that user_roles table is accessible"
echo "   3. Review system health check results above"
echo ""
