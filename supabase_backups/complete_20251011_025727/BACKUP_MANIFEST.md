# COMPREHENSIVE SUPABASE BACKUP MANIFEST

**Backup Created**: Sat Oct 11 02:57:28 CEST 2025
**Backup ID**: yacht_sentinel_complete_20251011_025727
**Backup Type**: Complete System Backup
**Database**: Yacht Sentinel AI
**Superadmin**: superadmin@yachtexcel.com

## 📁 BACKUP CONTENTS

### 🗄️ Database Files
- `yacht_sentinel_complete_20251011_025727_complete.dump` - Complete database (PostgreSQL custom format)
- `yacht_sentinel_complete_20251011_025727_schema.sql` - Database schema only
- `yacht_sentinel_complete_20251011_025727_data.sql` - Database data only

### 🔒 Security & Policies  
- `yacht_sentinel_complete_20251011_025727_rls_policies.sql` - All Row Level Security policies
- `yacht_sentinel_complete_20251011_025727_auth_users.sql` - Auth users (SQL format)
- `yacht_sentinel_complete_20251011_025727_auth_users.csv` - Auth users (CSV format)
- `yacht_sentinel_complete_20251011_025727_user_roles.csv` - User roles mapping

### ⚡ Functions
- `yacht_sentinel_complete_20251011_025727_rpc_functions.sql` - All RPC/PostgreSQL functions
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
    --dbname=postgres "yacht_sentinel_complete_20251011_025727_complete.dump"
```

### Selective Restore:
```bash
# Restore RLS policies
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251011_025727_rls_policies.sql"

# Restore RPC functions  
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251011_025727_rpc_functions.sql"

# Restore auth users
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
    -f "yacht_sentinel_complete_20251011_025727_auth_users.sql"
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
- **RLS Policies**:     70
- **RPC Functions**:     15
- **Edge Functions**:       73
- **Auth Users**:      1
- **Migrations**:       15
- **Backup Size**: 1.6M
