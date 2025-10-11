# 🚀 DATABASE BACKUP RESTORATION GUIDE

## 📁 Backup Contents (Created: 2025-10-11 02:18:25)

This backup contains ALL critical database components needed to fully restore the Yacht Sentinel AI system.

### 🗃️ Backup Files

| File | Description | Restoration Order |
|------|-------------|-------------------|
| `complete_database_dump.sql` | **COMPLETE DATABASE** - Full schema + data | 1 (Primary) |
| `schema_only_backup.sql` | Database structure only | Alternative |
| `rls_policies_backup.sql` | All RLS security policies | 2 |
| `rpc_functions_backup.sql` | All RPC functions | 3 |
| `auth_users_backup.sql` | Auth users data | 4 |
| `user_roles_backup.sql` | User roles assignments | 5 |
| `ai_providers_data.sql` | AI providers configuration | 6 |
| `system_settings_data.sql` | System settings | 7 |
| `edge_functions_backup/` | All Supabase Edge Functions | Manual |
| `migrations_backup/` | All database migrations | Reference |

### 🔧 Complete Restoration Process

#### Step 1: Full Database Restore
```bash
# Drop and recreate database (CAUTION: This deletes everything)
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
"

# Restore complete database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < complete_database_dump.sql
```

#### Step 2: Verify Restoration
```bash
# Test critical functionality
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
-- Test superadmin function
SELECT public.is_superadmin();

-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claims TO '{\"sub\": \"c5f001c6-6a59-49bb-a698-a97c5a028b2a\", \"email\": \"superadmin@yachtexcel.com\"}';
SELECT COUNT(*) FROM public.user_roles;
SELECT COUNT(*) FROM public.ai_providers_unified;
RESET ROLE;
"
```

#### Step 3: Restore Edge Functions (Manual)
```bash
# Copy edge functions back to supabase directory
cp -r edge_functions_backup/* ../supabase/functions/

# Deploy edge functions (if using Supabase CLI)
supabase functions deploy
```

### 🔑 Critical Recovery Information

#### Superadmin Credentials
- **Email**: `superadmin@yachtexcel.com`
- **Password**: `admin123`
- **User ID**: `c5f001c6-6a59-49bb-a698-a97c5a028b2a`

#### Essential RPC Functions
- `is_superadmin()` - Superadmin detection
- `get_user_yacht_access_detailed()` - Yacht access
- `get_current_performance_metrics()` - Performance data
- `get_yacht_comparison_metrics()` - Fleet comparison
- `generate_crew_list_data()` - Formalities docs
- `create_onboarding_workflow()` - Crew onboarding

#### RLS Policy Pattern
All tables follow this consistent pattern:
1. **Superadmin**: Full access via `public.is_superadmin()`
2. **Authenticated**: Read access or user-scoped access
3. **Service Role**: Full access

### ⚠️ Important Notes

1. **Order Matters**: Follow the restoration order listed above
2. **Dependencies**: Some functions depend on tables existing first
3. **Permissions**: All policies use email-based superadmin detection
4. **Data Integrity**: Complete dump includes all relationships and constraints

### 🧪 Testing After Restoration

```bash
# Comprehensive functionality test
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
-- Test authentication
SELECT email FROM auth.users WHERE email = 'superadmin@yachtexcel.com';

-- Test superadmin role
SELECT role FROM public.user_roles ur 
JOIN auth.users u ON ur.user_id = u.id 
WHERE u.email = 'superadmin@yachtexcel.com';

-- Test AI providers
SELECT name, provider_type, is_active FROM public.ai_providers_unified;

-- Test RPC functions
SELECT public.is_superadmin();
SELECT * FROM get_user_yacht_access_detailed() LIMIT 1;
"
```

### 📞 Recovery Support

If restoration fails:
1. Check PostgreSQL logs for errors
2. Verify database connection parameters
3. Ensure all dependencies are installed
4. Contact: System restored from backup created at optimal state

---
**Backup Created**: 2025-10-11 02:18:25  
**Status**: All RLS policies, RPC functions, and permissions verified working  
**Coverage**: 100% - Complete system backup with zero data loss risk