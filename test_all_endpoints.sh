#!/bin/bash
# Test all critical API endpoints

ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing All API Endpoints..."
echo ""

ENDPOINTS=(
    "inventory_items"
    "ai_system_config"
    "audit_workflows"
    "system_settings"
    "ai_providers_unified"
    "ai_models_unified"
    "yacht_profiles"
    "yachts"
    "user_roles"
)

PASS=0
FAIL=0

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $ANON_KEY" \
        "http://127.0.0.1:54321/rest/v1/$endpoint?select=id&limit=1")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "406" ]; then
        echo -e "${GREEN}✅ $endpoint: HTTP $STATUS${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ $endpoint: HTTP $STATUS${NC}"
        FAIL=$((FAIL + 1))
    fi
done

# Test RPC functions
echo ""
echo "Testing RPC Functions..."
echo ""

RPC_FUNCTIONS=(
    "is_superadmin"
)

for func in "${RPC_FUNCTIONS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST \
        -H "apikey: $ANON_KEY" \
        -H "Content-Type: application/json" \
        "http://127.0.0.1:54321/rest/v1/rpc/$func" \
        -d '{}')
    
    if [ "$STATUS" = "200" ]; then
        echo -e "${GREEN}✅ RPC $func: HTTP $STATUS${NC}"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}❌ RPC $func: HTTP $STATUS${NC}"
        FAIL=$((FAIL + 1))
    fi
done

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All endpoints working!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some endpoints failed${NC}"
    exit 1
fi
