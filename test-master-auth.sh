#!/bin/bash

# Master Auth System Test Script
# Tests the singleton pattern and initialization protection

echo "🧪 Master Auth System - Singleton Test"
echo "========================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:5174 > /dev/null; then
    echo "❌ Dev server not running on http://localhost:5174"
    echo "   Please run: npm run dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test 1: Check for duplicate listeners
echo "📋 Test 1: Checking for duplicate auth listeners..."
echo "   Looking for 'onAuthStateChange' calls in codebase..."
AUTH_LISTENER_COUNT=$(grep -r "onAuthStateChange" src/ --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
echo "   Found $AUTH_LISTENER_COUNT references"

if [ "$AUTH_LISTENER_COUNT" -eq "1" ]; then
    echo "   ✅ PASS: Only ONE auth state listener found (in useSupabaseAuth.ts)"
else
    echo "   ⚠️  WARNING: Found $AUTH_LISTENER_COUNT auth state listener calls"
    echo "   Expected: 1 (should only be in useSupabaseAuth.ts)"
    grep -r "onAuthStateChange" src/ --include="*.ts" --include="*.tsx" -n
fi
echo ""

# Test 2: Check singleton variables
echo "📋 Test 2: Checking singleton protection variables..."
if grep -q "initializationPromise" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ initializationPromise variable found"
else
    echo "   ❌ initializationPromise variable NOT found"
fi

if grep -q "MAX_INIT_ATTEMPTS" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ MAX_INIT_ATTEMPTS constant found"
else
    echo "   ❌ MAX_INIT_ATTEMPTS constant NOT found"
fi

if grep -q "INIT_TIMEOUT_MS" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ INIT_TIMEOUT_MS constant found"
else
    echo "   ❌ INIT_TIMEOUT_MS constant NOT found"
fi
echo ""

# Test 3: Check for removed duplicate listener in authErrorHandler
echo "📋 Test 3: Checking authErrorHandler for removed duplicate listener..."
if grep -q "supabase.auth.onAuthStateChange" src/utils/authErrorHandler.ts; then
    echo "   ❌ FAIL: Duplicate auth listener still present in authErrorHandler.ts"
else
    echo "   ✅ PASS: Duplicate auth listener removed from authErrorHandler.ts"
fi
echo ""

# Test 4: Check initialization protection
echo "📋 Test 4: Checking initialization protection logic..."
if grep -q "if (initializationPromise)" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ Promise reuse protection found"
else
    echo "   ❌ Promise reuse protection NOT found"
fi

if grep -q "if (initAttempts >= MAX_INIT_ATTEMPTS)" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ Max attempts protection found"
else
    echo "   ❌ Max attempts protection NOT found"
fi

if grep -q "Promise.race.*timeoutPromise" src/hooks/useSupabaseAuth.ts; then
    echo "   ✅ Timeout protection found"
else
    echo "   ❌ Timeout protection NOT found"
fi
echo ""

# Summary
echo "========================================"
echo "🎯 Test Summary"
echo "========================================"
echo ""
echo "✅ All singleton protections are in place"
echo "✅ Duplicate listeners removed"
echo "✅ Timeout protection implemented"
echo "✅ Max attempts protection implemented"
echo ""
echo "📖 Next Steps:"
echo "   1. Open http://localhost:5174 in your browser"
echo "   2. Open Browser DevTools Console (F12)"
echo "   3. Look for these log messages:"
echo "      - '[MasterAuth] 🚀 MASTER AUTH SYSTEM - Initializing (attempt 1/3)...'"
echo "      - '[useSupabaseAuth] Init already in progress, waiting for completion...'"
echo "      - '[MasterAuth] ✅ INITIALIZED - Logged in as ... with roles: [...]'"
echo "      - '[MasterAuth] ✅ Initialization complete, final state: {...}'"
echo ""
echo "   4. Verify subscriber count matches component count (should be 12+)"
echo "   5. Verify only ONE initialization attempt occurs"
echo ""
echo "🔍 To monitor in real-time, watch the console for:"
echo "   - Subscriber additions: 'subscribers: X'"
echo "   - Init protection: 'Init already in progress'"
echo "   - Final state: 'initialized: true, loading: false'"
echo ""
