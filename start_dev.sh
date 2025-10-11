#!/bin/bash

echo "🚀 STARTING DEVELOPMENT STACK"
echo "=============================="

# Navigate to project directory
cd /Users/carlosjulia/yacht-sentinel-ai-complete

# Start Supabase
echo "Starting Supabase..."
supabase start

# Start React development server
echo "Starting React development server..."
npm run dev