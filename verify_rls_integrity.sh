#!/bin/bash

# ============================================================================
# RLS POLICY INTEGRITY VERIFICATION AND FIX
# ============================================================================
# This script ensures RLS policies are in correct state after backup restore
# Based on memory: "Startup Script RLS Integrity Check"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Database connection details
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

echo -e "${BLUE}🔍 Verifying RLS Policy Integrity...${NC}"

# Check current ai_providers_unified policies
POLICY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified';" 2>/dev/null | xargs)

echo -e "${BLUE}📊 Current ai_providers_unified policies: $POLICY_COUNT${NC}"

# Expected clean state: exactly 3 policies
EXPECTED_POLICIES=("superadmin_complete_access" "service_role_complete_access" "authenticated_read_only")

# Check if we have the expected policies
CLEAN_STATE=true
for policy in "${EXPECTED_POLICIES[@]}"; do
    EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified' AND policyname = '$policy';" 2>/dev/null | xargs)
    
    if [ "$EXISTS" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Missing expected policy: $policy${NC}"
        CLEAN_STATE=false
    fi
done

# Check for unexpected policies (more than 3 total means we have conflicting ones)
if [ "$POLICY_COUNT" -gt 3 ]; then
    echo -e "${YELLOW}⚠️  Found $POLICY_COUNT policies, expected 3. Conflicting policies detected.${NC}"
    CLEAN_STATE=false
fi

if [ "$CLEAN_STATE" = true ]; then
    echo -e "${GREEN}✅ RLS policies are in correct state${NC}"
    exit 0
fi

echo -e "${YELLOW}🛠️  Fixing RLS policy conflicts...${NC}"

# Apply the comprehensive fix
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Drop ALL existing policies on ai_providers_unified
DROP POLICY IF EXISTS "Service role full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated read access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated write access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Authenticated update access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Superadmin and service delete access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow superadmin full access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated write" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "service_role_full_access_ai_providers" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "superadmin_full_access_ai_providers" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_read_access_ai_providers" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_insert_access_ai_providers" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_update_access_ai_providers" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "superadmin_all_access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "authenticated_read_access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "service_role_full_access" ON public.ai_providers_unified;
DROP POLICY IF EXISTS "superadmin_full_access" ON public.ai_providers_unified;

-- Create the correct policies (only if they don't exist)
CREATE POLICY IF NOT EXISTS "superadmin_complete_access"
ON public.ai_providers_unified
FOR ALL
TO authenticated
USING (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
)
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE email = 'superadmin@yachtexcel.com'
    )
);

CREATE POLICY IF NOT EXISTS "service_role_complete_access"
ON public.ai_providers_unified
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_read_only"
ON public.ai_providers_unified
FOR SELECT
TO authenticated
USING (true);
EOF

# Verify the fix
FINAL_POLICY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified';" 2>/dev/null | xargs)

if [ "$FINAL_POLICY_COUNT" -eq 3 ]; then
    echo -e "${GREEN}✅ RLS policy integrity restored ($FINAL_POLICY_COUNT clean policies)${NC}"
    
    # Show the final policies
    echo -e "${BLUE}📋 Current policies:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'ai_providers_unified' ORDER BY policyname;"
else
    echo -e "${RED}❌ RLS policy fix failed. Policy count: $FINAL_POLICY_COUNT${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 RLS integrity verification complete!${NC}"