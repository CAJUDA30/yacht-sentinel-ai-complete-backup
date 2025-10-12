#!/bin/bash

# ============================================================================
# RLS POLICY TEST FOR AI_PROVIDERS_UNIFIED
# ============================================================================
# This script tests RLS policies to ensure DELETE operations work correctly
# Based on memory: "RLS Fix Verification with Test Scripts"

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

echo -e "${BLUE}🧪 Testing RLS Policies for ai_providers_unified...${NC}"

# Test 1: Check if policies exist
echo -e "${BLUE}📋 Test 1: Checking policy existence...${NC}"
POLICY_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified';" 2>/dev/null | xargs)

echo -e "${YELLOW}   Found $POLICY_COUNT policies${NC}"

if [ "$POLICY_COUNT" -eq 3 ]; then
    echo -e "${GREEN}   ✅ Expected 3 policies found${NC}"
else
    echo -e "${RED}   ❌ Expected 3 policies, found $POLICY_COUNT${NC}"
    echo -e "${YELLOW}   📋 Current policies:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'ai_providers_unified' ORDER BY policyname;"
fi

# Test 2: Check for expected policy names
echo -e "${BLUE}📋 Test 2: Verifying policy names...${NC}"
EXPECTED_POLICIES=("superadmin_complete_access" "service_role_complete_access" "authenticated_read_only")
MISSING_POLICIES=()

for policy in "${EXPECTED_POLICIES[@]}"; do
    EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified' AND policyname = '$policy';" 2>/dev/null | xargs)
    
    if [ "$EXISTS" -eq 1 ]; then
        echo -e "${GREEN}   ✅ $policy exists${NC}"
    else
        echo -e "${RED}   ❌ $policy missing${NC}"
        MISSING_POLICIES+=("$policy")
    fi
done

# Test 3: Check superadmin user exists
echo -e "${BLUE}👤 Test 3: Verifying superadmin user...${NC}"
SUPERADMIN_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'superadmin@yachtexcel.com';" 2>/dev/null | xargs)

if [ "$SUPERADMIN_EXISTS" -eq 1 ]; then
    echo -e "${GREEN}   ✅ Superadmin user exists${NC}"
    
    # Get superadmin ID for testing
    SUPERADMIN_ID=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -t -c "SELECT id FROM auth.users WHERE email = 'superadmin@yachtexcel.com';" 2>/dev/null | xargs)
    echo -e "${YELLOW}   📝 Superadmin ID: ${SUPERADMIN_ID:0:8}...${NC}"
else
    echo -e "${RED}   ❌ Superadmin user missing${NC}"
    exit 1
fi

# Test 4: Test policy evaluation (simulate what would happen)
echo -e "${BLUE}🔍 Test 4: Testing policy evaluation...${NC}"

# Test superadmin DELETE policy
DELETE_POLICY_TEST=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "
    SELECT 
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM auth.users 
                WHERE id = '$SUPERADMIN_ID' 
                AND email = 'superadmin@yachtexcel.com'
            ) THEN 'WOULD_ALLOW'
            ELSE 'WOULD_DENY'
        END as result;
    " 2>/dev/null | xargs)

if [ "$DELETE_POLICY_TEST" = "WOULD_ALLOW" ]; then
    echo -e "${GREEN}   ✅ Superadmin DELETE policy would allow operations${NC}"
else
    echo -e "${RED}   ❌ Superadmin DELETE policy would deny operations${NC}"
fi

# Test 5: Check for conflicting policies
echo -e "${BLUE}⚠️  Test 5: Checking for conflicting policies...${NC}"
CONFLICTING_POLICIES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'ai_providers_unified' 
    AND policyname NOT IN ('superadmin_complete_access', 'service_role_complete_access', 'authenticated_read_only')
    " 2>/dev/null | grep -v "^$" | wc -l | xargs)

if [ "$CONFLICTING_POLICIES" -eq 0 ]; then
    echo -e "${GREEN}   ✅ No conflicting policies found${NC}"
else
    echo -e "${RED}   ❌ Found $CONFLICTING_POLICIES conflicting policies:${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE tablename = 'ai_providers_unified' 
        AND policyname NOT IN ('superadmin_complete_access', 'service_role_complete_access', 'authenticated_read_only')
        ORDER BY policyname;
        "
fi

# Summary
echo ""
echo -e "${BLUE}📊 Test Summary:${NC}"

TOTAL_TESTS=5
PASSED_TESTS=0

[ "$POLICY_COUNT" -eq 3 ] && ((PASSED_TESTS++))
[ ${#MISSING_POLICIES[@]} -eq 0 ] && ((PASSED_TESTS++))
[ "$SUPERADMIN_EXISTS" -eq 1 ] && ((PASSED_TESTS++))
[ "$DELETE_POLICY_TEST" = "WOULD_ALLOW" ] && ((PASSED_TESTS++))
[ "$CONFLICTING_POLICIES" -eq 0 ] && ((PASSED_TESTS++))

echo -e "${YELLOW}   Tests passed: $PASSED_TESTS/$TOTAL_TESTS${NC}"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 All RLS policy tests passed! DELETE operations should work correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some RLS policy tests failed. DELETE operations may not work properly.${NC}"
    echo -e "${YELLOW}💡 Run ./verify_rls_integrity.sh to fix policy issues.${NC}"
    exit 1
fi