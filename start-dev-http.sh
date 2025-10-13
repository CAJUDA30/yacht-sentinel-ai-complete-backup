#!/bin/bash

# Start development server with HTTP (original behavior)
echo "🚀 Starting Yacht Sentinel AI with HTTP..."
echo "📡 Server will be available at: http://localhost:5173"
echo "⚠️  Web Crypto API will use development fallback (PLAIN: prefix)"
echo ""

# Temporarily disable HTTPS in vite config
if [ -f "vite.config.ts.backup" ]; then
    cp vite.config.ts.backup vite.config.ts
    npm run dev
    # Restore HTTPS config after
    git checkout vite.config.ts 2>/dev/null || true
else
    echo "❌ No HTTP backup config found"
    exit 1
fi
