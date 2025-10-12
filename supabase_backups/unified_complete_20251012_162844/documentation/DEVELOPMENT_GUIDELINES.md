# 🛠️ YACHT SENTINEL AI - DEVELOPMENT GUIDELINES

## 📋 **WHEN TO RESET vs WHEN TO MIGRATE**

### **🔄 USE DATABASE RESET WHEN:**

#### **✅ Schema Changes**
- Adding new tables or major structural changes
- Changing table relationships or foreign keys
- Modifying column types or constraints
- Adding/removing indexes that affect data integrity

#### **✅ Migration Issues**
- Migration failures or corruption
- Migration order problems (dates out of sequence)
- Conflicting migrations from multiple developers

#### **✅ Development Environment**
- Setting up fresh development environment
- Testing new features from clean slate
- Major refactoring that affects multiple tables
- Need consistent test data across team

#### **✅ Data Corruption**
- Invalid data states from testing
- Broken relationships between tables
- Test data that doesn't represent real scenarios

**Reset Command:**
```bash
npx supabase db reset --local
```

---

### **📈 USE MIGRATIONS ONLY WHEN:**

#### **✅ Incremental Changes**
- Adding new columns to existing tables
- Creating new indexes for performance
- Small schema adjustments
- Adding new functions or procedures

#### **✅ Production-Like Changes**
- Changes that need to be applied to production
- Preserving existing data during development
- Testing migration rollback scenarios

#### **✅ Data Preservation**
- Working with important test data
- Collaboration with other developers
- Demonstrating features to stakeholders

**Migration Commands:**
```bash
# Apply specific migration
npx supabase migration up --local

# Create new migration
npx supabase migration new migration_name

# Check migration status
npx supabase migration list --local
```

---

## 🚀 **DEVELOPMENT WORKFLOW**

### **Daily Development Routine**

#### **Morning Setup:**
```bash
# 1. Check system status
npx supabase status

# 2. If not running, start Supabase
npx supabase start

# 3. Verify superadmin access
curl -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@yachtexcel.com", "password": "admin123"}'

# 4. Start frontend
npm run dev
```

#### **Feature Development:**
```bash
# For new features affecting schema:
npx supabase db reset --local
./restore_superadmin_improved.sh
npm run dev

# For small changes:
npx supabase migration new feature_name
# Edit migration file
npx supabase migration up --local
```

#### **End of Day:**
```bash
# Save important changes
git add .
git commit -m "Feature: descriptive message"

# Optional: Stop services to free resources
npx supabase stop
```

---

### **Team Collaboration Rules**

#### **Before Pushing Code:**
1. **Test full cycle reset:**
   ```bash
   npx supabase db reset --local
   ./restore_superadmin_improved.sh
   npm run dev
   ```

2. **Verify all functionality:**
   - Login works
   - Document AI Manager loads
   - No console errors
   - All API endpoints respond

3. **Update documentation:**
   - Update CHANGELOG.md
   - Document any new features
   - Update environment setup if needed

#### **Migration Naming Convention:**
```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
20251012100000_create_document_ai_processors.sql
20251012110000_add_user_preferences_table.sql
20251012120000_update_yacht_schema.sql
```

---

## ⚠️ **CRITICAL RECOVERY SCENARIOS**

### **Scenario 1: "Everything is Broken"**
```bash
# Nuclear option - complete fresh start
npx supabase stop
rm -rf .supabase  # Only if completely broken
npx supabase start
npx supabase db reset --local
./restore_superadmin_improved.sh
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
npm run dev
```

### **Scenario 2: "User Can't Login"**
```bash
# Quick user restoration
./restore_superadmin_improved.sh
```

### **Scenario 3: "Frontend Errors After DB Changes"**
```bash
# Regenerate types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
# Restart frontend
npm run dev
```

### **Scenario 4: "Migration Failed"**
```bash
# Check migration status
npx supabase migration list --local

# If needed, repair migration
npx supabase migration repair --status applied

# Or reset and start fresh
npx supabase db reset --local
```

---

## 📊 **SYSTEM HEALTH CHECKS**

### **Daily Health Check Script**
Use the comprehensive health check: `./check_system_health.sh`

This script checks:
- **Core Services:** Supabase status
- **Database Infrastructure:** Tables, Migrations, RLS Policies, RPC Functions, Edge Functions  
- **Data Integrity:** Users, Superadmin, Document AI Processors, Sample Data, Role Permissions
- **API Connectivity:** REST API, Auth API, Edge Functions API
- **System Summary:** Health score, issues count, and specific recommendations

**Health Score Interpretation:**
- 🎉 **90-100%:** Excellent - Ready for production
- ✨ **70-89%:** Good - Minor warnings only  
- ⚠️ **50-69%:** Warning - Needs attention
- 🚨 **Below 50%:** Critical - Immediate action required

**Critical vs Warning Items:**
- **Critical (❌):** Role permissions missing, Auth API down, Core services failed
- **Warning (⚠️):** Sample yacht data missing (normal for new systems), Edge functions not responding, Migration status

**Sample Data Policy:**
- Missing yacht data is **normal** for new installations
- Role permissions are **critical** for user access control
- Document AI processors should always be configured
```bash
#!/bin/bash
echo "🔍 YACHT SENTINEL AI - SYSTEM HEALTH CHECK"
echo "========================================"

# Check Supabase status
if npx supabase status > /dev/null 2>&1; then
    echo "✅ Supabase is running"
else
    echo "❌ Supabase is not running"
    exit 1
fi

# Check database tables
TABLE_COUNT=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -ge "15" ]; then
    echo "✅ Database has $TABLE_COUNT tables"
else
    echo "⚠️  Database has only $TABLE_COUNT tables (expected 15+)"
fi

# Check superadmin user
SUPERADMIN_EXISTS=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'superadmin@yachtexcel.com';" 2>/dev/null | tr -d ' ')
if [ "$SUPERADMIN_EXISTS" = "1" ]; then
    echo "✅ Superadmin user exists"
else
    echo "❌ Superadmin user missing"
fi

# Check Document AI processors
PROCESSOR_COUNT=$(psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -t -c "SELECT COUNT(*) FROM public.document_ai_processors WHERE is_active = true;" 2>/dev/null | tr -d ' ')
if [ "$PROCESSOR_COUNT" -ge "3" ]; then
    echo "✅ Document AI processors: $PROCESSOR_COUNT active"
else
    echo "⚠️  Only $PROCESSOR_COUNT Document AI processors active"
fi

# Test API endpoint  
if curl -sf "http://127.0.0.1:54321/rest/v1/document_ai_processors" -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" > /dev/null 2>&1; then
    echo "✅ API endpoints responsive"
else
    echo "❌ API endpoints not responding"
fi

echo ""
echo "🎯 RECOMMENDATIONS:"
if [ "$TABLE_COUNT" -lt "15" ] || [ "$SUPERADMIN_EXISTS" != "1" ] || [ "$PROCESSOR_COUNT" -lt "3" ]; then
    echo "   Run: npx supabase db reset --local && ./restore_superadmin_improved.sh"
else
    echo "   System is healthy! ✨"
fi
```

---

## 🔧 **TROUBLESHOOTING QUICK REFERENCE**

| Issue | Solution | Command |
|-------|----------|---------|
| Supabase not running | Start services | `npx supabase start` |
| TypeScript errors | Regenerate types | `npx supabase gen types typescript --local > src/integrations/supabase/types.ts` |
| Login fails | Restore superadmin | `./restore_superadmin_improved.sh` |
| Missing tables | Reset database | `npx supabase db reset --local` |
| API 403 errors | Check RLS policies | Check user roles and permissions |
| Frontend won't start | Check port conflicts | `npm run dev` on different port |
| Migration conflicts | Reset and reapply | `npx supabase db reset --local` |

---

## 📈 **PERFORMANCE GUIDELINES**

### **Database Optimization:**
- Use indexes on frequently queried columns
- Limit large data selections with pagination
- Use prepared statements for repeated queries
- Monitor query performance in Supabase Studio

### **Frontend Performance:**
- Lazy load components when possible
- Use React.memo for expensive components
- Implement proper loading states
- Cache API responses when appropriate

### **Development Speed:**
- Use parallel tool calls for information gathering
- Group related changes in single commits
- Test incrementally rather than big-bang testing
- Keep development environment stable

---

## 🚦 **DEPLOYMENT READINESS CHECKLIST**

Before deploying to production:

- [ ] All migrations tested locally
- [ ] Seed file creates required data
- [ ] RLS policies properly configured
- [ ] API endpoints returning correct data
- [ ] Frontend has no console errors
- [ ] Login/logout functionality works
- [ ] Document AI processors are configured
- [ ] TypeScript types are current
- [ ] Environment variables configured
- [ ] Backup strategy in place

---

## 📚 **USEFUL COMMANDS REFERENCE**

```bash
# Database Management
npx supabase db reset --local           # Fresh start
npx supabase migration list --local     # Check migrations
npx supabase migration new name         # Create migration
npx supabase migration up --local       # Apply migrations

# User Management
./restore_superadmin_improved.sh        # Restore superadmin
psql "postgresql://..." -c "QUERY"      # Direct SQL queries

# Type Generation
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

# System Status
npx supabase status                     # Check all services
npx supabase logs --level info          # View logs

# Development
npm run dev                             # Start frontend
npm run build                           # Build for production
npm run test                            # Run tests
```

---

**Remember: When in doubt, reset and restore! It's faster than debugging complex state issues.**