#!/bin/bash

# Auto-increment version on build
# This ensures cache invalidation happens automatically

# Read current version from package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Split version into parts
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR="${VERSION_PARTS[0]}"
MINOR="${VERSION_PARTS[1]}"
PATCH="${VERSION_PARTS[2]}"

# Increment patch version
PATCH=$((PATCH + 1))

# Create new version
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "📦 Incrementing version: $CURRENT_VERSION → $NEW_VERSION"

# Update package.json (works on both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
else
  # Linux
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
fi

echo "✅ Version updated to $NEW_VERSION"
echo "🔄 Cache will be automatically cleared on next app load"
