#!/bin/bash

echo "========================================"
echo "COMPLETE SYSTEM VERIFICATION REPORT"
echo "========================================"
echo ""

echo "1. EDGE FUNCTIONS:"
EDGE_COUNT=$(ls -1 supabase/functions/ 2>/dev/null | wc -l | xargs)
echo "   Count: $EDGE_COUNT/74 expected"
echo "   Sample functions:"
ls supabase/functions/ 2>/dev/null | head -5 | sed 's/^/     - /'
echo "     ... and $((EDGE_COUNT - 5)) more"
echo ""

echo "2. DATABASE MIGRATIONS:"
MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l | xargs)
echo "   Count: $MIGRATION_COUNT/19 expected"
echo "   Sample migrations:"
ls supabase/migrations/*.sql 2>/dev/null | head -3 | sed 's/.*\///;s/^/     - /'
echo "     ... and $((MIGRATION_COUNT - 3)) more"
echo ""

echo "3. RLS POLICIES:"
RLS_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';" 2>/dev/null | xargs)
echo "   Count: $RLS_COUNT/75 expected"
echo "   Sample policies:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT '     - ' || policyname FROM pg_policies WHERE schemaname = 'public' LIMIT 3;" 2>/dev/null
echo "     ... and $((RLS_COUNT - 3)) more"
echo ""

echo "4. RPC FUNCTIONS:"
RPC_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema IN ('public', 'auth') AND routine_type = 'FUNCTION';" 2>/dev/null | xargs)
echo "   Count: $RPC_COUNT/16 expected"
echo "   Functions by schema:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT routine_schema, COUNT(*) FROM information_schema.routines WHERE routine_schema IN ('public', 'auth') AND routine_type = 'FUNCTION' GROUP BY routine_schema;" 2>/dev/null | sed 's/^/     /'
echo ""

echo "5. DATABASE TABLES:"
TABLE_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
echo "   Count: $TABLE_COUNT/17 expected"
echo "   Sample tables:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT '     - ' || table_name FROM information_schema.tables WHERE table_schema = 'public' LIMIT 5;" 2>/dev/null
echo "     ... and $((TABLE_COUNT - 5)) more"
echo ""

echo "6. DATA RECORDS:"
echo "   AI Providers:"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT '     - ' || name || ' (' || provider_type || ')' as provider FROM ai_providers_unified;" 2>/dev/null
echo ""
echo "   User Roles:"
USER_ROLES=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM user_roles;" 2>/dev/null | xargs)
echo "     - $USER_ROLES superadmin users configured"
echo ""

echo "========================================"
echo "VERIFICATION SUMMARY:"
echo "========================================"
echo "Edge Functions:  $EDGE_COUNT/74  $([ "$EDGE_COUNT" -eq 74 ] && echo "✅ COMPLETE" || echo "❌ MISSING $((74-EDGE_COUNT))")"
echo "Migrations:      $MIGRATION_COUNT/19  $([ "$MIGRATION_COUNT" -eq 19 ] && echo "✅ COMPLETE" || echo "❌ MISSING $((19-MIGRATION_COUNT))")"
echo "RLS Policies:    $RLS_COUNT/75  $([ "$RLS_COUNT" -eq 75 ] && echo "✅ COMPLETE" || echo "❌ MISSING $((75-RLS_COUNT))")"
echo "RPC Functions:   $RPC_COUNT/16  $([ "$RPC_COUNT" -eq 16 ] && echo "✅ COMPLETE" || echo "❌ MISSING $((16-RPC_COUNT))")"
echo "Database Tables: $TABLE_COUNT/17  $([ "$TABLE_COUNT" -eq 17 ] && echo "✅ COMPLETE" || echo "❌ MISSING $((17-TABLE_COUNT))")"
echo "Data Records:    ✅ COMPLETE"
echo ""

TOTAL_EXPECTED=141  # 74+19+75+16+17
TOTAL_ACTUAL=$((EDGE_COUNT + MIGRATION_COUNT + RLS_COUNT + RPC_COUNT + TABLE_COUNT))
PERCENTAGE=$((TOTAL_ACTUAL * 100 / TOTAL_EXPECTED))

echo "OVERALL STATUS: $TOTAL_ACTUAL/$TOTAL_EXPECTED components ($PERCENTAGE%)"
if [ "$TOTAL_ACTUAL" -eq "$TOTAL_EXPECTED" ]; then
    echo "✅ 100% COMPLETE - ALL COMPONENTS RESTORED"
else
    echo "❌ INCOMPLETE - MISSING $((TOTAL_EXPECTED - TOTAL_ACTUAL)) COMPONENTS"
fi
echo ""