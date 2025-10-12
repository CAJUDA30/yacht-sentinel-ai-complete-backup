#!/bin/bash
echo "🔍 YACHT SENTINEL AI - COMPREHENSIVE SYSTEM HEALTH CHECK"
echo "═══════════════════════════════════════════════════════════"

# Configuration
DB_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
API_URL="http://127.0.0.1:54321"

# Initialize counters for final assessment
ISSUE_COUNT=0
WARNING_COUNT=0

echo "║ CORE SERVICES HEALTH                                        ║"
echo "╠══════════════════════════════════════════════════════════╣"

# Check Supabase status
if npx supabase status > /dev/null 2>&1; then
    echo "║ ✅ Supabase Services: RUNNING                               ║"
else
    echo "║ ❌ Supabase Services: NOT RUNNING                           ║"
    ((ISSUE_COUNT++))
    echo "║    → Run: npx supabase start                                ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    exit 1
fi

echo "║                                                              ║"
echo "║ DATABASE INFRASTRUCTURE                                      ║"
echo "╠══════════════════════════════════════════════════════════╣"

# Check Database Tables
TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
if [ "$TABLE_COUNT" -ge "15" ]; then
    printf "║ ✅ Database Tables: %-38s ║\n" "$TABLE_COUNT tables"
else
    printf "║ ⚠️  Database Tables: %-38s ║\n" "$TABLE_COUNT tables (expected 15+)"
    ((WARNING_COUNT++))
fi

# Check Migrations
MIGRATION_STATUS=$(npx supabase migration list --local 2>/dev/null | grep -c "Applied" || echo "0")
MIGRATION_PENDING=$(npx supabase migration list --local 2>/dev/null | grep -c "Pending" || echo "0")
# Clean up the values to ensure they're numeric
MIGRATION_STATUS=$(echo "$MIGRATION_STATUS" | tr -d '\n' | tr -d ' ')
MIGRATION_PENDING=$(echo "$MIGRATION_PENDING" | tr -d '\n' | tr -d ' ')
if [ "$MIGRATION_PENDING" = "0" ]; then
    printf "║ ✅ Migrations: %-42s ║\n" "$MIGRATION_STATUS applied, 0 pending"
else
    printf "║ ⚠️  Migrations: %-42s ║\n" "$MIGRATION_STATUS applied, $MIGRATION_PENDING pending"
    ((WARNING_COUNT++))
fi

# Check RLS Policies
RLS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM pg_policies;" 2>/dev/null | tr -d ' ')
if [ "$RLS_COUNT" -ge "10" ]; then
    printf "║ ✅ RLS Policies: %-40s ║\n" "$RLS_COUNT policies active"
else
    printf "║ ⚠️  RLS Policies: %-40s ║\n" "$RLS_COUNT policies (expected 10+)"
    ((WARNING_COUNT++))
fi

# Check RPC Functions
FUNCTION_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';" 2>/dev/null | tr -d ' ')
if [ "$FUNCTION_COUNT" -ge "5" ]; then
    printf "║ ✅ RPC Functions: %-39s ║\n" "$FUNCTION_COUNT functions"
else
    printf "║ ⚠️  RPC Functions: %-39s ║\n" "$FUNCTION_COUNT functions (expected 5+)"
    ((WARNING_COUNT++))
fi

# Check Edge Functions
EDGE_FUNCTIONS_DIR="supabase/functions"
if [ -d "$EDGE_FUNCTIONS_DIR" ]; then
    # Count actual function directories (each function should have its own directory)
    EDGE_FUNCTION_COUNT=$(find "$EDGE_FUNCTIONS_DIR" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
    if [ "$EDGE_FUNCTION_COUNT" -ge "1" ]; then
        printf "║ ✅ Edge Functions: %-38s ║\n" "$EDGE_FUNCTION_COUNT functions deployed"
    else
        printf "║ ⚠️  Edge Functions: %-38s ║\n" "No functions found"
        ((WARNING_COUNT++))
    fi
else
    EDGE_FUNCTION_COUNT=0
    printf "║ ⚠️  Edge Functions: %-38s ║\n" "Directory not found"
    ((WARNING_COUNT++))
fi

echo "║                                                              ║"
echo "║ DATA INTEGRITY                                               ║"
echo "╠══════════════════════════════════════════════════════════╣"

# Check Data Records - Core Tables
USER_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | tr -d ' ')
if [ "$USER_COUNT" -ge "1" ]; then
    printf "║ ✅ Data Records (Users): %-32s ║\n" "$USER_COUNT users"
else
    printf "║ ❌ Data Records (Users): %-32s ║\n" "No users found"
    ((ISSUE_COUNT++))
fi

# Check superadmin user specifically
SUPERADMIN_EXISTS=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'superadmin@yachtexcel.com';" 2>/dev/null | tr -d ' ')
if [ "$SUPERADMIN_EXISTS" = "1" ]; then
    printf "║ ✅ Superadmin User: %-37s ║\n" "CONFIGURED"
else
    printf "║ ❌ Superadmin User: %-37s ║\n" "MISSING"
    ((ISSUE_COUNT++))
fi

# Check Document AI processors
PROCESSOR_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM public.document_ai_processors WHERE is_active = true;" 2>/dev/null | tr -d ' ')
if [ "$PROCESSOR_COUNT" -ge "3" ]; then
    printf "║ ✅ Document AI Processors: %-30s ║\n" "$PROCESSOR_COUNT active"
else
    printf "║ ⚠️  Document AI Processors: %-30s ║\n" "$PROCESSOR_COUNT active (expected 3+)"
    ((WARNING_COUNT++))
fi

# Check yacht data
YACHT_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM public.yachts;" 2>/dev/null | tr -d ' ' | tr -d '\n')
if [ -z "$YACHT_COUNT" ] || ! [[ "$YACHT_COUNT" =~ ^[0-9]+$ ]]; then
    YACHT_COUNT="0"
fi
if [ "$YACHT_COUNT" -ge "1" ]; then
    printf "║ ✅ Sample Yacht Data: %-34s ║\n" "$YACHT_COUNT yachts"
else
    printf "║ ⚠️  Sample Yacht Data: %-34s ║\n" "No sample data"
    ((WARNING_COUNT++))
fi

# Check role permissions
PERMISSION_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM public.role_permissions;" 2>/dev/null | tr -d ' ' | tr -d '\n')
# Ensure we have a valid number, handle table not existing
if [ -z "$PERMISSION_COUNT" ] || ! [[ "$PERMISSION_COUNT" =~ ^[0-9]+$ ]]; then
    PERMISSION_COUNT="0"
    printf "║ ❌ Role Permissions: %-36s ║\n" "Table missing (CRITICAL)"
    ((ISSUE_COUNT++))
elif [ "$PERMISSION_COUNT" -ge "20" ]; then
    printf "║ ✅ Role Permissions: %-36s ║\n" "$PERMISSION_COUNT permissions"
else
    printf "║ ❌ Role Permissions: %-36s ║\n" "$PERMISSION_COUNT permissions (need 20+)"
    ((ISSUE_COUNT++))
fi

echo "║                                                              ║"
echo "║ API CONNECTIVITY                                             ║"
echo "╠══════════════════════════════════════════════════════════╣"

# Test REST API endpoint
if curl -sf "$API_URL/rest/v1/document_ai_processors" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
    printf "║ ✅ REST API Endpoints: %-34s ║\n" "RESPONSIVE"
else
    # Fallback test with basic rest endpoint to check if service is up
    if curl -sf "$API_URL/rest/v1/" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
        printf "║ ✅ REST API Endpoints: %-34s ║\n" "RESPONSIVE (basic)"
    else
        # Final test - check if REST service responds at all (even with errors)
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/rest/v1/" -H "apikey: $ANON_KEY" 2>/dev/null)
        if [ "$HTTP_CODE" -ge "200" ] && [ "$HTTP_CODE" -lt "500" ]; then
            printf "║ ✅ REST API Endpoints: %-34s ║\n" "RESPONSIVE (HTTP $HTTP_CODE)"
        else
            printf "║ ❌ REST API Endpoints: %-34s ║\n" "NOT RESPONDING"
            ((ISSUE_COUNT++))
        fi
    fi
fi

# Test Auth API endpoint
if curl -sf "$API_URL/auth/v1/health" > /dev/null 2>&1; then
    printf "║ ✅ Auth API Endpoints: %-34s ║\n" "RESPONSIVE"
else
    # Try settings endpoint as fallback
    if curl -sf "$API_URL/auth/v1/settings" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
        printf "║ ✅ Auth API Endpoints: %-34s ║\n" "RESPONSIVE"
    else
        # Check if auth service is running by testing signup endpoint (should return method info)
        if curl -sf "$API_URL/auth/v1/signup" -H "apikey: $ANON_KEY" -X OPTIONS > /dev/null 2>&1; then
            printf "║ ✅ Auth API Endpoints: %-34s ║\n" "RESPONSIVE"
        else
            printf "║ ⚠️  Auth API Endpoints: %-34s ║\n" "LIMITED/DOWN"
            ((WARNING_COUNT++))
        fi
    fi
fi

# Test Edge Functions endpoint (if any exist)
if [ "$EDGE_FUNCTION_COUNT" -ge "1" ]; then
    # Try to test if edge functions service is available
    # First check if we have a known function to test
    if [ -d "supabase/functions/gcp-unified-config" ]; then
        # Test specific function endpoint
        if curl -sf "$API_URL/functions/v1/gcp-unified-config" -H "apikey: $ANON_KEY" -X OPTIONS > /dev/null 2>&1; then
            printf "║ ✅ Edge Functions API: %-33s ║\n" "RESPONSIVE"
        else
            printf "║ ⚠️  Edge Functions API: %-33s ║\n" "LIMITED ACCESS"
            ((WARNING_COUNT++))
        fi
    else
        # Test generic functions endpoint
        if curl -sf "$API_URL/functions/v1/" -H "apikey: $ANON_KEY" > /dev/null 2>&1; then
            printf "║ ✅ Edge Functions API: %-33s ║\n" "RESPONSIVE"
        else
            printf "║ ⚠️  Edge Functions API: %-33s ║\n" "SERVICE DOWN"
            ((WARNING_COUNT++))
        fi
    fi
else
    printf "║ ➖ Edge Functions API: %-33s ║\n" "N/A (no functions)"
fi

echo "║                                                              ║"
echo "║ SYSTEM SUMMARY                                               ║"
echo "╠══════════════════════════════════════════════════════════╣"

# Calculate overall health score
TOTAL_CHECKS=15
HEALTHY_CHECKS=$((TOTAL_CHECKS - ISSUE_COUNT - WARNING_COUNT))
HEALTH_PERCENTAGE=$((HEALTHY_CHECKS * 100 / TOTAL_CHECKS))

printf "║ 📊 System Health Score: %-32s ║\n" "$HEALTH_PERCENTAGE% ($HEALTHY_CHECKS/$TOTAL_CHECKS)"
printf "║ ❌ Critical Issues: %-37s ║\n" "$ISSUE_COUNT"
printf "║ ⚠️  Warnings: %-45s ║\n" "$WARNING_COUNT"

echo "║                                                              ║"
echo "║ RECOMMENDATIONS                                              ║"
echo "╠══════════════════════════════════════════════════════════╣"

if [ "$ISSUE_COUNT" -gt "0" ]; then
    echo "║ 🚨 CRITICAL: System requires immediate attention             ║"
    if [ "$PERMISSION_COUNT" = "0" ]; then
        echo "║    → Missing permissions: npx supabase migration up --local   ║"
        echo "║    → Then reset: npx supabase db reset --local             ║"
    else
        echo "║    → Auth issues: Check Supabase auth configuration        ║"
    fi
    echo "║    → Full recovery: ./restore_superadmin_improved.sh         ║"
elif [ "$WARNING_COUNT" -gt "3" ]; then
    echo "║ ⚠️  WARNING: Several components need attention               ║"
    if [ "$YACHT_COUNT" = "0" ]; then
        echo "║    → No sample data (normal for new systems)                ║"
        echo "║    → Optional: Add sample yachts via frontend              ║"
    else
        echo "║    → Check migration status: npx supabase migration list   ║"
    fi
elif [ "$WARNING_COUNT" -gt "0" ]; then
    echo "║ ✨ GOOD: System is mostly healthy with minor warnings       ║"
    if [ "$YACHT_COUNT" = "0" ]; then
        echo "║    → Missing sample data is normal for new installations   ║"
    fi
    echo "║    → Review warnings above for optimization opportunities   ║"
else
    echo "║ 🎉 EXCELLENT: All systems are running optimally!            ║"
    echo "║    → System is ready for development and production use     ║"
fi

echo "╚══════════════════════════════════════════════════════════╝"

# Exit with appropriate code
if [ "$ISSUE_COUNT" -gt "0" ]; then
    exit 1
elif [ "$WARNING_COUNT" -gt "3" ]; then
    exit 2
else
    exit 0
fi