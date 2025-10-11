# COMPREHENSIVE SUPABASE BACKUP MANIFEST

**Backup Created**: Sun Oct 12 00:48:16 CEST 2025
**Backup ID**: yacht_sentinel_complete_20251012_004815
**Backup Type**: Complete System Backup
**Database**: Yacht Sentinel AI
**Superadmin**: superadmin@yachtexcel.com

## 📁 BACKUP CONTENTS

### 🗄️ Database Files
- `yacht_sentinel_complete_20251012_004815_complete.dump` - Complete database (PostgreSQL custom format)
- `yacht_sentinel_complete_20251012_004815_schema.sql` - Database schema only
- `yacht_sentinel_complete_20251012_004815_data.sql` - Database data only

### 🔒 Security & Policies  
- `yacht_sentinel_complete_20251012_004815_rls_policies.sql` - All Row Level Security policies
- `yacht_sentinel_complete_20251012_004815_auth_users.sql` - Auth users (SQL format)
- `yacht_sentinel_complete_20251012_004815_auth_users.csv` - Auth users (CSV format)
- `yacht_sentinel_complete_20251012_004815_user_roles.csv` - User roles mapping

### ⚡ Functions
- `yacht_sentinel_complete_20251012_004815_rpc_functions.sql` - All RPC/PostgreSQL functions
- `edge_functions/` - All Edge functions (Deno/TypeScript)

### ⚙️ Configuration
- `config/` - Project configuration files
- `migrations/` - Database migration history

## 🔧 RESTORE INSTRUCTIONS

### Full Database Restore:
```bash
# Restore complete database
pg_restore --clean --if-exists --create --verbose \
    --host=localhost --port=54322 --username=postgres \
    --dbname=postgres "yacht_sentinel_complete_20251012_004815_complete.dump"
```

### Selective Restore:
```bash
# Restore RLS policies
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251012_004815_rls_policies.sql"

# Restore RPC functions  
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251012_004815_rpc_functions.sql"

# Restore auth users
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251012_004815_auth_users.sql"
```

### Edge Functions Restore:
```bash
# Copy Edge functions back
cp -r edge_functions/* ../supabase/functions/
npx supabase functions deploy
```

## 📊 BACKUP STATISTICS

### 📊 Statistics:
- **Tables**:     17
- **RLS Policies**:     75
- **RPC Functions**:     16
- **Edge Functions**:       73
- **Auth Users**:      1
- **Migrations**:       19
- **Backup Size**: 6.1M
