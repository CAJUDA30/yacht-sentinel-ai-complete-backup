#!/bin/bash

# Database Status Analysis Script
echo "🔍 YACHT SENTINEL AI - DATABASE STATUS ANALYSIS"
echo "================================================="
echo ""

# Database connection parameters
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

echo "1. 📊 MIGRATIONS STATUS:"
echo "------------------------"
MIGRATIONS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM supabase_migrations.schema_migrations;" 2>/dev/null | xargs || echo "0")
echo "   Total Migrations Applied: $MIGRATIONS_COUNT"
if [ "$MIGRATIONS_COUNT" -gt 0 ]; then
    echo "   Latest Migrations:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT version, executed_at FROM supabase_migrations.schema_migrations ORDER BY executed_at DESC LIMIT 5;" 2>/dev/null || echo "   Unable to fetch migration details"
fi
echo ""

echo "2. 📋 ALL DATABASE TABLES:"
echo "-------------------------"
TABLES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "0")
echo "   Total Tables: $TABLES_COUNT"
if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "   Table List:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch table list"
fi
echo ""

echo "3. 🔒 RLS POLICIES STATUS:"
echo "-------------------------"
RLS_POLICIES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_policies;" 2>/dev/null | xargs || echo "0")
echo "   Total RLS Policies: $RLS_POLICIES_COUNT"
if [ "$RLS_POLICIES_COUNT" -gt 0 ]; then
    echo "   Policy Breakdown by Table:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT tablename, COUNT(*) as policy_count FROM pg_policies GROUP BY tablename ORDER BY policy_count DESC;" 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch policy details"
fi
echo ""

echo "4. ⚙️  RPC FUNCTIONS STATUS:"
echo "---------------------------"
RPC_FUNCTIONS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';" 2>/dev/null | xargs || echo "0")
echo "   Total RPC Functions: $RPC_FUNCTIONS_COUNT"
if [ "$RPC_FUNCTIONS_COUNT" -gt 0 ]; then
    echo "   Key Functions:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name;" 2>/dev/null | head -20 | sed 's/^/     • /' || echo "   Unable to fetch function list"
fi
echo ""

echo "5. 📊 ALL DATA RECORDS:"
echo "----------------------"
TOTAL_RECORDS=0
echo "   Records by Table:"
if [ "$TABLES_COUNT" -gt 0 ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT 
        schemaname||'.'||tablename as table_name,
        n_tup_ins as records
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public' 
    ORDER BY n_tup_ins DESC;
    " 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch record counts"
fi
echo ""

echo "6. 👥 USERS AND ENCRYPTED PASSWORDS:"
echo "------------------------------------"
USERS_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM auth.users;" 2>/dev/null | xargs || echo "0")
echo "   Total Users: $USERS_COUNT"
if [ "$USERS_COUNT" -gt 0 ]; then
    echo "   User Details:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT 
        email,
        CASE 
            WHEN encrypted_password IS NOT NULL AND encrypted_password != '' THEN 'ENCRYPTED'
            ELSE 'NO_PASSWORD'
        END as password_status,
        created_at::date as created
    FROM auth.users 
    ORDER BY created_at;
    " 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch user details"
fi
echo ""

echo "7. 🎭 USER ROLES:"
echo "----------------"
USER_ROLES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM public.user_roles;" 2>/dev/null | xargs || echo "0")
echo "   Total User Roles: $USER_ROLES_COUNT"
if [ "$USER_ROLES_COUNT" -gt 0 ]; then
    echo "   Role Assignments:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "
    SELECT 
        u.email,
        ur.role,
        CASE WHEN ur.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END as status
    FROM public.user_roles ur
    LEFT JOIN auth.users u ON ur.user_id = u.id
    ORDER BY ur.role, u.email;
    " 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch role details"
fi
echo ""

echo "8. 🔐 ENCRYPTION FUNCTIONS:"
echo "---------------------------"
ENCRYPTION_FUNCTIONS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null | xargs || echo "0")
echo "   Encryption Functions: $ENCRYPTION_FUNCTIONS"
if [ "$ENCRYPTION_FUNCTIONS" -gt 0 ]; then
    echo "   Available Functions:"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%encrypt%';" 2>/dev/null | sed 's/^/     • /' || echo "   Unable to fetch encryption functions"
fi
echo ""

echo "9. 🌐 EDGE FUNCTIONS:"
echo "--------------------"
if [ -d "./supabase/functions" ]; then
    EDGE_FUNCTIONS_COUNT=$(find ./supabase/functions -name "index.ts" 2>/dev/null | wc -l | xargs || echo "0")
    echo "   Local Edge Functions: $EDGE_FUNCTIONS_COUNT"
    if [ "$EDGE_FUNCTIONS_COUNT" -gt 0 ]; then
        echo "   Function List:"
        find ./supabase/functions -maxdepth 2 -name "index.ts" 2>/dev/null | sed 's|./supabase/functions/||g' | sed 's|/index.ts||g' | sed 's/^/     • /' || echo "   Unable to list edge functions"
    fi
else
    echo "   Edge Functions Directory: NOT FOUND"
fi
echo ""

echo "🎯 SUMMARY:"
echo "----------"
echo "   Migrations:        $MIGRATIONS_COUNT"
echo "   Tables:            $TABLES_COUNT"
echo "   RLS Policies:      $RLS_POLICIES_COUNT"
echo "   RPC Functions:     $RPC_FUNCTIONS_COUNT"
echo "   Users:             $USERS_COUNT"
echo "   User Roles:        $USER_ROLES_COUNT"
echo "   Encryption Funcs:  $ENCRYPTION_FUNCTIONS"
echo "   Edge Functions:    $EDGE_FUNCTIONS_COUNT"
echo ""

# Check if database is properly loaded
if [ "$TABLES_COUNT" -lt 15 ]; then
    echo "❌ DATABASE APPEARS TO BE INCOMPLETE (Less than 15 tables)"
    echo "💡 Suggestion: Run ./start_full_stack.sh to restore from backup"
elif [ "$RLS_POLICIES_COUNT" -lt 50 ]; then
    echo "⚠️  RLS POLICIES MAY BE INCOMPLETE (Less than 50 policies)"
    echo "💡 Suggestion: Check if backup restoration completed successfully"
elif [ "$USERS_COUNT" -lt 5 ]; then
    echo "⚠️  USERS MAY BE INCOMPLETE (Less than 5 users)"
    echo "💡 Suggestion: Run user creation script"
else
    echo "✅ DATABASE APPEARS TO BE PROPERLY LOADED"
fi

echo ""
echo "================================================="