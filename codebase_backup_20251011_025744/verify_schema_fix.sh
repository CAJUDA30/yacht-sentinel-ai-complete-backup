#!/bin/bash

# Database Schema Verification Script
# Verifies that all schema fixes have been applied correctly

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Database Schema Verification - Post Fix            ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Database connection params
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_USER="postgres"
DB_NAME="postgres"
DB_PASSWORD="postgres"

# Check 1: ai_providers_unified table exists with all columns
echo -e "${BLUE}1️⃣  Checking ai_providers_unified table schema...${NC}"

REQUIRED_COLUMNS=(
    "id"
    "name"
    "auth_method"
    "provider_type"
    "priority"
    "is_primary"
    "rate_limit_per_minute"
    "supported_languages"
    "last_health_check"
    "health_status"
    "error_count"
    "success_rate"
    "config"
    "is_active"
)

for column in "${REQUIRED_COLUMNS[@]}"; do
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "\d public.ai_providers_unified" 2>/dev/null | grep -q "$column"; then
        echo -e "${GREEN}   ✅ Column '$column' exists${NC}"
    else
        echo -e "${RED}   ❌ Column '$column' missing!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
echo ""

# Check 2: ai_models_unified table exists
echo -e "${BLUE}2️⃣  Checking ai_models_unified table...${NC}"

if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -c "\d public.ai_models_unified" >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ ai_models_unified table exists${NC}"
    
    # Check foreign key relationship
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "\d public.ai_models_unified" 2>/dev/null | grep -q "provider_id.*REFERENCES"; then
        echo -e "${GREEN}   ✅ Foreign key to ai_providers_unified exists${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Foreign key relationship not found${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}   ❌ ai_models_unified table missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 3: Data exists in tables
echo -e "${BLUE}3️⃣  Checking for data in tables...${NC}"

PROVIDER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM public.ai_providers_unified;" 2>/dev/null | xargs)

if [ "$PROVIDER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}   ✅ ai_providers_unified has $PROVIDER_COUNT provider(s)${NC}"
    
    # Show providers
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "SELECT name, provider_type, auth_method, is_active FROM public.ai_providers_unified;" 2>/dev/null | \
        while read line; do
            echo -e "${GREEN}      $line${NC}"
        done
else
    echo -e "${YELLOW}   ⚠️  ai_providers_unified is empty${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

MODEL_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM public.ai_models_unified;" 2>/dev/null | xargs)

if [ "$MODEL_COUNT" -gt 0 ]; then
    echo -e "${GREEN}   ✅ ai_models_unified has $MODEL_COUNT model(s)${NC}"
    
    # Show models
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -c "SELECT name, display_name, model_type, is_active FROM public.ai_models_unified LIMIT 5;" 2>/dev/null | \
        while read line; do
            echo -e "${GREEN}      $line${NC}"
        done
else
    echo -e "${YELLOW}   ⚠️  ai_models_unified is empty${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 4: RLS policies exist
echo -e "${BLUE}4️⃣  Checking RLS policies...${NC}"

PROVIDER_POLICIES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_providers_unified';" 2>/dev/null | xargs)

if [ "$PROVIDER_POLICIES" -gt 0 ]; then
    echo -e "${GREEN}   ✅ ai_providers_unified has $PROVIDER_POLICIES RLS policy(ies)${NC}"
else
    echo -e "${YELLOW}   ⚠️  ai_providers_unified has no RLS policies${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

MODEL_POLICIES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'ai_models_unified';" 2>/dev/null | xargs)

if [ "$MODEL_POLICIES" -gt 0 ]; then
    echo -e "${GREEN}   ✅ ai_models_unified has $MODEL_POLICIES RLS policy(ies)${NC}"
else
    echo -e "${YELLOW}   ⚠️  ai_models_unified has no RLS policies${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check 5: Indexes exist
echo -e "${BLUE}5️⃣  Checking indexes...${NC}"

REQUIRED_INDEXES=(
    "idx_ai_providers_unified_type"
    "idx_ai_providers_unified_priority"
    "idx_ai_providers_unified_primary"
    "idx_ai_models_unified_provider_id"
    "idx_ai_models_unified_active"
    "idx_ai_models_unified_priority"
)

for index in "${REQUIRED_INDEXES[@]}"; do
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -t -c "SELECT 1 FROM pg_indexes WHERE indexname = '$index';" 2>/dev/null | grep -q 1; then
        echo -e "${GREEN}   ✅ Index '$index' exists${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Index '$index' missing${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done
echo ""

# Check 6: Superadmin account
echo -e "${BLUE}6️⃣  Checking superadmin account...${NC}"

if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    -t -c "SELECT 1 FROM auth.users WHERE email = 'superadmin@yachtexcel.com';" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}   ✅ Superadmin account exists${NC}"
    
    # Check if has superadmin role
    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
        -t -c "SELECT 1 FROM public.user_roles ur JOIN auth.users u ON u.id = ur.user_id WHERE u.email = 'superadmin@yachtexcel.com' AND ur.role = 'superadmin';" 2>/dev/null | grep -q 1; then
        echo -e "${GREEN}   ✅ Superadmin has correct role${NC}"
    else
        echo -e "${RED}   ❌ Superadmin missing role!${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}   ❌ Superadmin account missing!${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check 7: Test API endpoints
echo -e "${BLUE}7️⃣  Testing API endpoints...${NC}"

# Test ai_providers_unified endpoint
PROVIDER_API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
    "http://127.0.0.1:54321/rest/v1/ai_providers_unified?select=id&limit=1")

if [ "$PROVIDER_API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}   ✅ ai_providers_unified API endpoint: HTTP $PROVIDER_API_RESPONSE${NC}"
elif [ "$PROVIDER_API_RESPONSE" = "406" ]; then
    echo -e "${GREEN}   ✅ ai_providers_unified API endpoint: HTTP $PROVIDER_API_RESPONSE (table empty but accessible)${NC}"
else
    echo -e "${RED}   ❌ ai_providers_unified API endpoint: HTTP $PROVIDER_API_RESPONSE${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test ai_models_unified endpoint
MODEL_API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" \
    "http://127.0.0.1:54321/rest/v1/ai_models_unified?select=id&limit=1")

if [ "$MODEL_API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}   ✅ ai_models_unified API endpoint: HTTP $MODEL_API_RESPONSE${NC}"
elif [ "$MODEL_API_RESPONSE" = "406" ]; then
    echo -e "${GREEN}   ✅ ai_models_unified API endpoint: HTTP $MODEL_API_RESPONSE (table empty but accessible)${NC}"
else
    echo -e "${RED}   ❌ ai_models_unified API endpoint: HTTP $MODEL_API_RESPONSE${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}║  ✅ All verification checks passed!                   ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📋 System Status: FULLY OPERATIONAL${NC}"
    echo -e "${GREEN}   ✅ All required columns present${NC}"
    echo -e "${GREEN}   ✅ All required tables exist${NC}"
    echo -e "${GREEN}   ✅ Foreign key relationships established${NC}"
    echo -e "${GREEN}   ✅ Data populated${NC}"
    echo -e "${GREEN}   ✅ RLS policies active${NC}"
    echo -e "${GREEN}   ✅ Indexes created${NC}"
    echo -e "${GREEN}   ✅ API endpoints responding${NC}"
    echo -e "${GREEN}   ✅ Superadmin account ready${NC}"
    echo ""
    echo -e "${BLUE}🎉 The application should now load without database schema errors!${NC}"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}║  ⚠️  Checks passed with warnings                      ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}📋 System Status: FUNCTIONAL (with warnings)${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo -e "${YELLOW}   Review warnings above - system should still work${NC}"
else
    echo -e "${RED}║  ❌ Verification failed - issues detected             ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}📋 System Status: ISSUES DETECTED${NC}"
    echo -e "${RED}   Errors: $ERRORS${NC}"
    echo -e "${YELLOW}   Warnings: $WARNINGS${NC}"
    echo -e "${RED}   Review errors above and fix immediately${NC}"
fi
echo ""

exit $ERRORS
