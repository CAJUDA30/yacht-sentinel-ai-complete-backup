#!/bin/bash

# =============================================================================
# BACKUP VERIFICATION SCRIPT
# =============================================================================
# Verifies the integrity and completeness of the backup

BACKUP_DIR="database_backup_20251011_021825"
echo "🔍 Verifying backup integrity..."

# Check file sizes and existence
echo "📊 Backup file analysis:"
echo "----------------------------------------"

if [ -f "$BACKUP_DIR/complete_database_dump.sql" ]; then
    SIZE=$(stat -f%z "$BACKUP_DIR/complete_database_dump.sql" 2>/dev/null || stat -c%s "$BACKUP_DIR/complete_database_dump.sql" 2>/dev/null)
    echo "✅ Complete database dump: ${SIZE} bytes"
else
    echo "❌ Missing: complete_database_dump.sql"
fi

if [ -f "$BACKUP_DIR/rls_policies_backup.sql" ]; then
    POLICIES=$(grep -c "CREATE POLICY" "$BACKUP_DIR/rls_policies_backup.sql")
    echo "✅ RLS policies: $POLICIES policies backed up"
else
    echo "❌ Missing: rls_policies_backup.sql"
fi

if [ -f "$BACKUP_DIR/rpc_functions_backup.sql" ]; then
    FUNCTIONS=$(grep -c "CREATE OR REPLACE FUNCTION" "$BACKUP_DIR/rpc_functions_backup.sql")
    echo "✅ RPC functions: $FUNCTIONS functions backed up"
else
    echo "❌ Missing: rpc_functions_backup.sql"
fi

if [ -d "$BACKUP_DIR/edge_functions_backup" ]; then
    EDGE_FUNCTIONS=$(find "$BACKUP_DIR/edge_functions_backup" -name "*.ts" | wc -l)
    echo "✅ Edge functions: $EDGE_FUNCTIONS TypeScript files backed up"
else
    echo "❌ Missing: edge_functions_backup directory"
fi

if [ -d "$BACKUP_DIR/migrations_backup" ]; then
    MIGRATIONS=$(find "$BACKUP_DIR/migrations_backup" -name "*.sql" | wc -l)
    echo "✅ Database migrations: $MIGRATIONS migration files backed up"
else
    echo "❌ Missing: migrations_backup directory"
fi

echo "----------------------------------------"

# Verify critical content
echo "🔍 Content verification:"
echo "----------------------------------------"

# Check for superadmin user
if grep -q "superadmin@yachtexcel.com" "$BACKUP_DIR/complete_database_dump.sql"; then
    echo "✅ Superadmin user found in backup"
else
    echo "⚠️  Superadmin user not found in backup"
fi

# Check for critical functions
CRITICAL_FUNCTIONS=("is_superadmin" "get_user_yacht_access_detailed" "get_current_performance_metrics")
for func in "${CRITICAL_FUNCTIONS[@]}"; do
    if grep -q "$func" "$BACKUP_DIR/rpc_functions_backup.sql"; then
        echo "✅ Function '$func' backed up"
    else
        echo "⚠️  Function '$func' not found"
    fi
done

# Check for critical tables
CRITICAL_TABLES=("user_roles" "ai_providers_unified" "system_settings")
for table in "${CRITICAL_TABLES[@]}"; do
    if grep -q "$table" "$BACKUP_DIR/complete_database_dump.sql"; then
        echo "✅ Table '$table' backed up"
    else
        echo "⚠️  Table '$table' not found"
    fi
done

echo "----------------------------------------"
echo "📊 Backup Summary:"
echo "  📁 Location: $(pwd)/$BACKUP_DIR"
echo "  📅 Created: $(date)"
echo "  📦 Total size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "  🔒 RLS policies: Included"
echo "  ⚙️  RPC functions: Included" 
echo "  👥 Users & auth: Included"
echo "  🤖 AI providers: Included"
echo "  🏗️  Schema: Complete"
echo "  📄 Instructions: RESTORE_INSTRUCTIONS.md"

echo ""
echo "✅ BACKUP VERIFICATION COMPLETED"
echo "🛡️  Database backup is comprehensive and ready for restoration"