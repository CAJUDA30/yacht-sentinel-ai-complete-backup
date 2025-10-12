#!/bin/bash

echo "🧹 Sanitizing backup files for GitHub upload..."

# Function to sanitize a file
sanitize_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        echo "  📄 Sanitizing: $file"
        # Replace real API keys with placeholders
        sed -i '' 's/xai-[a-zA-Z0-9_-]\{20,\}/xai-REDACTED_FOR_GITHUB_SECURITY/g' "$file"
        sed -i '' 's/sk-[a-zA-Z0-9_-]\{40,\}/sk-REDACTED_FOR_GITHUB_SECURITY/g' "$file"
        sed -i '' 's/AIza[a-zA-Z0-9_-]\{35\}/AIzaREDACTED_FOR_GITHUB_SECURITY/g' "$file"
        sed -i '' 's/sk-ant-[a-zA-Z0-9_-]\{40,\}/sk-ant-REDACTED_FOR_GITHUB_SECURITY/g' "$file"
        # Replace any 129-character potential legacy API keys
        sed -i '' 's/[a-zA-Z0-9_-]\{129\}/LEGACY_API_KEY_REDACTED_FOR_GITHUB_SECURITY/g' "$file"
    fi
}

# Find and sanitize all backup SQL files
find supabase_backups/ -name "*.sql" -type f | while read -r file; do
    sanitize_file "$file"
done

# Find and sanitize any TypeScript files in backups that might contain keys
find supabase_backups/ -name "*.ts" -type f | while read -r file; do
    sanitize_file "$file"
done

# Find and sanitize any documentation files that might contain keys
find supabase_backups/ -name "*.md" -type f | while read -r file; do
    sanitize_file "$file"
done

echo "✅ Backup sanitization complete!"
echo "🔒 All API keys have been replaced with security placeholders"
echo "📁 Ready for safe GitHub upload"