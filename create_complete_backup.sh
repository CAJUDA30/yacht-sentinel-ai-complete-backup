#!/bin/bash

# ============================================================================
# COMPREHENSIVE SUPABASE BACKUP SYSTEM
# ============================================================================
# Creates complete backup including:
# - Database schema & data (all tables)  
# - RLS policies (Row Level Security)
# - RPC functions (PostgreSQL functions)
# - Edge functions (Deno/TypeScript)
# - Auth users (with metadata)
# - All configurations and settings
# ============================================================================

set -e  # Exit on any error

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="supabase_backups/complete_${TIMESTAMP}"
BACKUP_PREFIX="yacht_sentinel_complete_${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Database connection
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${WHITE}🚀 COMPREHENSIVE SUPABASE BACKUP SYSTEM${NC}"
echo -e "${WHITE}=======================================${NC}"
echo -e "${BLUE}📅 Timestamp: ${TIMESTAMP}${NC}"
echo -e "${BLUE}📁 Backup Directory: ${BACKUP_DIR}${NC}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# ============================================================================
# 1. COMPLETE DATABASE DUMP (Schema + Data)
# ============================================================================
echo -e "${CYAN}🗄️  Step 1: Creating complete database dump...${NC}"

# Full database dump with all schemas, data, and metadata
npx supabase db dump --local --data-only -f "${BACKUP_DIR}/${BACKUP_PREFIX}_data.sql"
npx supabase db dump --local -f "${BACKUP_DIR}/${BACKUP_PREFIX}_schema.sql"

# Combined dump for easy restore
pg_dump "${DB_URL}" \
    --clean \
    --if-exists \
    --create \
    --verbose \
    --file="${BACKUP_DIR}/${BACKUP_PREFIX}_complete.dump" \
    --format=custom

echo -e "${GREEN}✅ Database dump completed${NC}"

# ============================================================================
# 2. RLS POLICIES BACKUP
# ============================================================================
echo -e "${CYAN}🔒 Step 2: Backing up RLS policies...${NC}"

psql "${DB_URL}" -c "
-- Export all RLS policies with full details
SELECT 
    'DROP POLICY IF EXISTS \"' || policyname || '\" ON ' || schemaname || '.' || tablename || ';' || E'\n' ||
    CASE 
        WHEN cmd = 'ALL' THEN 
            'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || E'\n' ||
            'FOR ALL TO ' || array_to_string(roles, ', ') || E'\n' ||
            CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ')' || E'\n' ELSE '' END ||
            CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check || ');' ELSE ';' END
        WHEN cmd = 'SELECT' THEN
            'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || E'\n' ||
            'FOR SELECT TO ' || array_to_string(roles, ', ') || E'\n' ||
            CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ');' ELSE ';' END
        WHEN cmd = 'INSERT' THEN
            'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || E'\n' ||
            'FOR INSERT TO ' || array_to_string(roles, ', ') || E'\n' ||
            CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check || ');' ELSE ';' END
        WHEN cmd = 'UPDATE' THEN
            'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || E'\n' ||
            'FOR UPDATE TO ' || array_to_string(roles, ', ') || E'\n' ||
            CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ')' || E'\n' ELSE '' END ||
            CASE WHEN with_check IS NOT NULL THEN 'WITH CHECK (' || with_check || ');' ELSE ';' END
        WHEN cmd = 'DELETE' THEN
            'CREATE POLICY \"' || policyname || '\" ON ' || schemaname || '.' || tablename || E'\n' ||
            'FOR DELETE TO ' || array_to_string(roles, ', ') || E'\n' ||
            CASE WHEN qual IS NOT NULL THEN 'USING (' || qual || ');' ELSE ';' END
        ELSE 
            '-- Unknown command: ' || cmd
    END || E'\n\n' as policy_sql
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
" -t -A > "${BACKUP_DIR}/${BACKUP_PREFIX}_rls_policies.sql"

echo -e "${GREEN}✅ RLS policies backed up${NC}"

# ============================================================================
# 3. RPC FUNCTIONS BACKUP
# ============================================================================
echo -e "${CYAN}⚡ Step 3: Backing up RPC functions...${NC}"

psql "${DB_URL}" -c "
-- Export all functions with full definitions
SELECT 
    'DROP FUNCTION IF EXISTS ' || n.nspname || '.' || p.proname || '(' || 
    pg_get_function_identity_arguments(p.oid) || ') CASCADE;' || E'\n' ||
    pg_get_functiondef(p.oid) || E'\n\n'
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'auth')
    AND p.prokind = 'f'
    AND p.proname NOT LIKE 'pg_%'
ORDER BY n.nspname, p.proname;
" -t -A > "${BACKUP_DIR}/${BACKUP_PREFIX}_rpc_functions.sql"

echo -e "${GREEN}✅ RPC functions backed up${NC}"

# ============================================================================
# 4. EDGE FUNCTIONS BACKUP
# ============================================================================
echo -e "${CYAN}🌐 Step 4: Backing up Edge functions...${NC}"

# Create Edge functions directory
mkdir -p "${BACKUP_DIR}/edge_functions"

# Copy all Edge functions
if [ -d "supabase/functions" ]; then
    cp -r supabase/functions/* "${BACKUP_DIR}/edge_functions/" 2>/dev/null || true
    
    # Count Edge functions
    EDGE_COUNT=$(find "${BACKUP_DIR}/edge_functions" -name "index.ts" | wc -l)
    echo -e "${GREEN}✅ ${EDGE_COUNT} Edge functions backed up${NC}"
else
    echo -e "${YELLOW}⚠️  No Edge functions directory found${NC}"
fi

# ============================================================================
# 5. AUTH USERS BACKUP
# ============================================================================
echo -e "${CYAN}👥 Step 5: Backing up auth users...${NC}"

psql "${DB_URL}" -c "
-- Export all auth users with complete data
COPY (
    SELECT 
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        is_sso_user,
        deleted_at
    FROM auth.users
    ORDER BY created_at
) TO STDOUT WITH CSV HEADER;
" > "${BACKUP_DIR}/${BACKUP_PREFIX}_auth_users.csv"

# Also create SQL format for easier restore
psql "${DB_URL}" -c "
-- Generate INSERT statements for auth users
SELECT 
    'INSERT INTO auth.users (' ||
    'id, aud, role, email, encrypted_password, email_confirmed_at, ' ||
    'invited_at, confirmation_token, confirmation_sent_at, recovery_token, ' ||
    'recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, ' ||
    'last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, ' ||
    'created_at, updated_at, phone, phone_confirmed_at, phone_change, ' ||
    'phone_change_token, phone_change_sent_at, email_change_token_current, ' ||
    'email_change_confirm_status, banned_until, reauthentication_token, ' ||
    'reauthentication_sent_at, is_sso_user, deleted_at' ||
    ') VALUES (' ||
    quote_literal(id::text) || ', ' ||
    quote_literal(aud) || ', ' ||
    quote_literal(role) || ', ' ||
    quote_literal(email) || ', ' ||
    quote_literal(encrypted_password) || ', ' ||
    COALESCE(quote_literal(email_confirmed_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(invited_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(confirmation_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(confirmation_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(recovery_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(recovery_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_token_new), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(last_sign_in_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(raw_app_meta_data::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(raw_user_meta_data::text), 'NULL') || ', ' ||
    COALESCE(is_super_admin::text, 'false') || ', ' ||
    quote_literal(created_at::text) || ', ' ||
    quote_literal(updated_at::text) || ', ' ||
    COALESCE(quote_literal(phone), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_confirmed_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(phone_change_sent_at::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(email_change_token_current), 'NULL') || ', ' ||
    COALESCE(email_change_confirm_status::text, '0') || ', ' ||
    COALESCE(quote_literal(banned_until::text), 'NULL') || ', ' ||
    COALESCE(quote_literal(reauthentication_token), 'NULL') || ', ' ||
    COALESCE(quote_literal(reauthentication_sent_at::text), 'NULL') || ', ' ||
    COALESCE(is_sso_user::text, 'false') || ', ' ||
    COALESCE(quote_literal(deleted_at::text), 'NULL') ||
    ') ON CONFLICT (id) DO NOTHING;'
FROM auth.users
ORDER BY created_at;
" -t -A > "${BACKUP_DIR}/${BACKUP_PREFIX}_auth_users.sql"

echo -e "${GREEN}✅ Auth users backed up${NC}"

# ============================================================================
# 6. USER ROLES BACKUP
# ============================================================================
echo -e "${CYAN}🔐 Step 6: Backing up user roles...${NC}"

psql "${DB_URL}" -c "
COPY (
    SELECT user_id, ur.role, ur.created_at, ur.updated_at, u.email
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON ur.user_id = u.id
    ORDER BY ur.created_at
) TO STDOUT WITH CSV HEADER;
" > "${BACKUP_DIR}/${BACKUP_PREFIX}_user_roles.csv"

echo -e "${GREEN}✅ User roles backed up${NC}"

# ============================================================================
# 7. CONFIGURATION FILES BACKUP
# ============================================================================
echo -e "${CYAN}⚙️  Step 7: Backing up configuration files...${NC}"

mkdir -p "${BACKUP_DIR}/config"

# Supabase config
[ -f "supabase/config.toml" ] && cp "supabase/config.toml" "${BACKUP_DIR}/config/"
[ -f "supabase/.env.local" ] && cp "supabase/.env.local" "${BACKUP_DIR}/config/"

# Project config
[ -f "package.json" ] && cp "package.json" "${BACKUP_DIR}/config/"
[ -f "tsconfig.json" ] && cp "tsconfig.json" "${BACKUP_DIR}/config/"
[ -f "vite.config.ts" ] && cp "vite.config.ts" "${BACKUP_DIR}/config/"

echo -e "${GREEN}✅ Configuration files backed up${NC}"

# ============================================================================
# 8. MIGRATIONS BACKUP
# ============================================================================
echo -e "${CYAN}📝 Step 8: Backing up migrations...${NC}"

mkdir -p "${BACKUP_DIR}/migrations"

if [ -d "supabase/migrations" ]; then
    cp -r supabase/migrations/* "${BACKUP_DIR}/migrations/" 2>/dev/null || true
    MIGRATION_COUNT=$(find "${BACKUP_DIR}/migrations" -name "*.sql" | wc -l)
    echo -e "${GREEN}✅ ${MIGRATION_COUNT} migrations backed up${NC}"
else
    echo -e "${YELLOW}⚠️  No migrations directory found${NC}"
fi

# ============================================================================
# 9. CREATE BACKUP MANIFEST
# ============================================================================
echo -e "${CYAN}📋 Step 9: Creating backup manifest...${NC}"

cat > "${BACKUP_DIR}/BACKUP_MANIFEST.md" << EOF
# COMPREHENSIVE SUPABASE BACKUP MANIFEST

**Backup Created**: $(date)
**Backup ID**: ${BACKUP_PREFIX}
**Backup Type**: Complete System Backup
**Database**: Yacht Sentinel AI
**Superadmin**: superadmin@yachtexcel.com

## 📁 BACKUP CONTENTS

### 🗄️ Database Files
- \`${BACKUP_PREFIX}_complete.dump\` - Complete database (PostgreSQL custom format)
- \`${BACKUP_PREFIX}_schema.sql\` - Database schema only
- \`${BACKUP_PREFIX}_data.sql\` - Database data only

### 🔒 Security & Policies  
- \`${BACKUP_PREFIX}_rls_policies.sql\` - All Row Level Security policies
- \`${BACKUP_PREFIX}_auth_users.sql\` - Auth users (SQL format)
- \`${BACKUP_PREFIX}_auth_users.csv\` - Auth users (CSV format)
- \`${BACKUP_PREFIX}_user_roles.csv\` - User roles mapping

### ⚡ Functions
- \`${BACKUP_PREFIX}_rpc_functions.sql\` - All RPC/PostgreSQL functions
- \`edge_functions/\` - All Edge functions (Deno/TypeScript)

### ⚙️ Configuration
- \`config/\` - Project configuration files
- \`migrations/\` - Database migration history

## 🔧 RESTORE INSTRUCTIONS

### Full Database Restore:
\`\`\`bash
# Restore complete database
pg_restore --clean --if-exists --create --verbose \\
    --host=localhost --port=54322 --username=postgres \\
    --dbname=postgres "${BACKUP_PREFIX}_complete.dump"
\`\`\`

### Selective Restore:
\`\`\`bash
# Restore RLS policies
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \\
    -f "${BACKUP_PREFIX}_rls_policies.sql"

# Restore RPC functions  
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \\
    -f "${BACKUP_PREFIX}_rpc_functions.sql"

# Restore auth users
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \\
    -f "${BACKUP_PREFIX}_auth_users.sql"
\`\`\`

### Edge Functions Restore:
\`\`\`bash
# Copy Edge functions back
cp -r edge_functions/* ../supabase/functions/
npx supabase functions deploy
\`\`\`

## 📊 BACKUP STATISTICS
EOF

# Add statistics to manifest
echo -e "\n### 📊 Statistics:" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

# Count tables
TABLES_COUNT=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo "- **Tables**: ${TABLES_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

# Count RLS policies  
POLICIES_COUNT=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';")
echo "- **RLS Policies**: ${POLICIES_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

# Count RPC functions
FUNCTIONS_COUNT=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname IN ('public', 'auth') AND p.prokind = 'f' AND p.proname NOT LIKE 'pg_%';")
echo "- **RPC Functions**: ${FUNCTIONS_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

# Count Edge functions
if [ -d "${BACKUP_DIR}/edge_functions" ]; then
    EDGE_COUNT=$(find "${BACKUP_DIR}/edge_functions" -name "index.ts" | wc -l)
    echo "- **Edge Functions**: ${EDGE_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"
fi

# Count auth users
USERS_COUNT=$(psql "${DB_URL}" -t -c "SELECT COUNT(*) FROM auth.users;")
echo "- **Auth Users**: ${USERS_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

# Count migrations
if [ -d "${BACKUP_DIR}/migrations" ]; then
    MIGRATION_COUNT=$(find "${BACKUP_DIR}/migrations" -name "*.sql" | wc -l)
    echo "- **Migrations**: ${MIGRATION_COUNT}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"
fi

# Calculate backup size
BACKUP_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "- **Backup Size**: ${BACKUP_SIZE}" >> "${BACKUP_DIR}/BACKUP_MANIFEST.md"

echo -e "${GREEN}✅ Backup manifest created${NC}"

# ============================================================================
# 10. CREATE RESTORE SCRIPT
# ============================================================================
echo -e "${CYAN}🔄 Step 10: Creating restore script...${NC}"

cat > "${BACKUP_DIR}/restore_complete_backup.sh" << 'EOF'
#!/bin/bash

# ============================================================================
# COMPLETE SUPABASE RESTORE SCRIPT
# ============================================================================

set -e

# Get backup directory (where this script is located)
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_PREFIX=$(basename "$BACKUP_DIR" | sed 's/complete_/yacht_sentinel_complete_/')

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m' 
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 COMPREHENSIVE SUPABASE RESTORE${NC}"
echo -e "${BLUE}==================================${NC}"
echo -e "Backup: ${BACKUP_PREFIX}"
echo ""

# Database connection
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo -e "${YELLOW}⚠️  This will completely replace your current database!${NC}"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

echo -e "${BLUE}🗄️  Restoring complete database...${NC}"
pg_restore --clean --if-exists --create --verbose \
    --host=localhost --port=54322 --username=postgres \
    --dbname=postgres "${BACKUP_PREFIX}_complete.dump"

echo -e "${BLUE}🔒 Restoring RLS policies...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_rls_policies.sql"

echo -e "${BLUE}⚡ Restoring RPC functions...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_rpc_functions.sql"

echo -e "${BLUE}👥 Restoring auth users...${NC}"
psql "${DB_URL}" -f "${BACKUP_PREFIX}_auth_users.sql"

if [ -d "edge_functions" ]; then
    echo -e "${BLUE}🌐 Restoring Edge functions...${NC}"
    cp -r edge_functions/* ../../supabase/functions/
fi

if [ -d "migrations" ]; then
    echo -e "${BLUE}📝 Restoring migrations...${NC}"
    cp -r migrations/* ../../supabase/migrations/
fi

echo -e "${GREEN}✅ Complete restore finished!${NC}"
echo -e "${GREEN}🚀 Restart Supabase to apply all changes${NC}"
EOF

chmod +x "${BACKUP_DIR}/restore_complete_backup.sh"

echo -e "${GREEN}✅ Restore script created${NC}"

# ============================================================================
# 11. FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${WHITE}🎉 COMPREHENSIVE BACKUP COMPLETED SUCCESSFULLY!${NC}"
echo -e "${WHITE}================================================${NC}"
echo -e "${GREEN}📁 Backup Location: ${BACKUP_DIR}${NC}"
echo -e "${GREEN}📊 Backup Size: $(du -sh "${BACKUP_DIR}" | cut -f1)${NC}"
echo ""
echo -e "${PURPLE}📋 BACKUP INCLUDES:${NC}"
echo -e "${CYAN}   🗄️  Complete database dump (schema + data)${NC}"
echo -e "${CYAN}   🔒 All RLS policies (${POLICIES_COUNT} policies)${NC}"
echo -e "${CYAN}   ⚡ All RPC functions (${FUNCTIONS_COUNT} functions)${NC}"
if [ -d "${BACKUP_DIR}/edge_functions" ]; then
    echo -e "${CYAN}   🌐 All Edge functions (${EDGE_COUNT} functions)${NC}"
fi
echo -e "${CYAN}   👥 All auth users (${USERS_COUNT} users)${NC}"
echo -e "${CYAN}   🔐 User roles and permissions${NC}"
echo -e "${CYAN}   ⚙️  Configuration files${NC}"
if [ -d "${BACKUP_DIR}/migrations" ]; then
    echo -e "${CYAN}   📝 All migrations (${MIGRATION_COUNT} files)${NC}"
fi
echo ""
echo -e "${PURPLE}🔄 TO RESTORE:${NC}"
echo -e "${CYAN}   cd ${BACKUP_DIR}${NC}"
echo -e "${CYAN}   ./restore_complete_backup.sh${NC}"
echo ""
echo -e "${PURPLE}📖 DOCUMENTATION:${NC}"
echo -e "${CYAN}   ${BACKUP_DIR}/BACKUP_MANIFEST.md${NC}"
echo ""
echo -e "${GREEN}✅ Your Yacht Sentinel AI system is fully backed up!${NC}"