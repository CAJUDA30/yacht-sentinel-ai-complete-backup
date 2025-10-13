#!/bin/bash

# HTTPS Development Setup Script
# This script sets up local HTTPS certificates for secure development

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    HTTPS Development Setup for Yacht Sentinel AI       ║${NC}"
echo -e "${BLUE}║    🔐 Enabling Web Crypto API in Development           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're on macOS and install mkcert if needed
echo -e "${BLUE}📋 Checking system requirements...${NC}"

if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${GREEN}✅ macOS detected${NC}"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        echo -e "${RED}❌ Homebrew not found${NC}"
        echo -e "${YELLOW}Please install Homebrew first: https://brew.sh/${NC}"
        exit 1
    fi
    
    # Check if mkcert is installed
    if ! command -v mkcert &> /dev/null; then
        echo -e "${YELLOW}⏳ Installing mkcert...${NC}"
        brew install mkcert
        echo -e "${GREEN}✅ mkcert installed${NC}"
    else
        echo -e "${GREEN}✅ mkcert already installed${NC}"
    fi
    
    # Install the local CA in the system trust store
    echo -e "${YELLOW}⏳ Installing local Certificate Authority...${NC}"
    mkcert -install
    echo -e "${GREEN}✅ Local CA installed${NC}"
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo -e "${GREEN}✅ Linux detected${NC}"
    
    # Check if mkcert is available
    if ! command -v mkcert &> /dev/null; then
        echo -e "${YELLOW}⏳ Installing mkcert...${NC}"
        
        # Try different package managers
        if command -v apt-get &> /dev/null; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y libnss3-tools
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
            chmod +x mkcert-v*-linux-amd64
            sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
        elif command -v yum &> /dev/null; then
            # RedHat/CentOS/Fedora
            sudo yum install -y nss-tools
            curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
            chmod +x mkcert-v*-linux-amd64
            sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
        else
            echo -e "${RED}❌ Package manager not supported. Please install mkcert manually${NC}"
            exit 1
        fi
        
        echo -e "${GREEN}✅ mkcert installed${NC}"
    else
        echo -e "${GREEN}✅ mkcert already installed${NC}"
    fi
    
    # Install the local CA
    echo -e "${YELLOW}⏳ Installing local Certificate Authority...${NC}"
    mkcert -install
    echo -e "${GREEN}✅ Local CA installed${NC}"
    
else
    echo -e "${RED}❌ Unsupported operating system: $OSTYPE${NC}"
    echo -e "${YELLOW}Please install mkcert manually: https://github.com/FiloSottile/mkcert${NC}"
    exit 1
fi

# Create certificates for local development
echo -e "${BLUE}🔐 Creating local HTTPS certificates...${NC}"

# Create certificates directory if it doesn't exist
mkdir -p ./certs

# Generate certificates for localhost and 127.0.0.1
echo -e "${YELLOW}⏳ Generating certificates...${NC}"
mkcert -key-file ./certs/localhost-key.pem -cert-file ./certs/localhost.pem localhost 127.0.0.1 ::1

if [ -f "./certs/localhost.pem" ] && [ -f "./certs/localhost-key.pem" ]; then
    echo -e "${GREEN}✅ Certificates created successfully${NC}"
    echo -e "${BLUE}   📁 Certificate: ./certs/localhost.pem${NC}"
    echo -e "${BLUE}   📁 Private Key: ./certs/localhost-key.pem${NC}"
else
    echo -e "${RED}❌ Certificate creation failed${NC}"
    exit 1
fi

# Update vite.config.ts to use HTTPS
echo -e "${BLUE}🔧 Updating Vite configuration for HTTPS...${NC}"

# Create backup of current config
cp vite.config.ts vite.config.ts.backup

# Check if fs import already exists
if ! grep -q "import fs from 'fs'" vite.config.ts; then
    # Add fs import at the top
    sed -i.tmp '1i\
import fs from '\''fs'\'';
' vite.config.ts
    rm -f vite.config.ts.tmp
fi

# Update the server configuration
python3 -c "
import re
import sys

# Read the file
with open('vite.config.ts', 'r') as f:
    content = f.read()

# Replace the server configuration
old_pattern = r'server: \{[^}]*\}'
new_config = '''server: {
    host: true, // Enable network access for multi-device testing
    port: 5173,
    https: {
      key: fs.readFileSync('./certs/localhost-key.pem'),
      cert: fs.readFileSync('./certs/localhost.pem'),
    },
  }'''

content = re.sub(old_pattern, new_config, content, flags=re.DOTALL)

# Write back to file
with open('vite.config.ts', 'w') as f:
    f.write(content)

print('✅ Vite configuration updated')
"

echo -e "${GREEN}✅ Vite configuration updated for HTTPS${NC}"

# Create a convenience script to start with HTTPS
echo -e "${BLUE}📝 Creating HTTPS development script...${NC}"

cat > start-dev-https.sh << 'EOF'
#!/bin/bash

# Start development server with HTTPS
echo "🚀 Starting Yacht Sentinel AI with HTTPS..."
echo "📡 Server will be available at: https://localhost:5173"
echo "🔐 Web Crypto API will be available (secure context)"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
EOF

chmod +x start-dev-https.sh

echo -e "${GREEN}✅ HTTPS development script created: ./start-dev-https.sh${NC}"

# Create an HTTP fallback script (original behavior)
echo -e "${BLUE}📝 Creating HTTP fallback script...${NC}"

cat > start-dev-http.sh << 'EOF'
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
EOF

chmod +x start-dev-http.sh

echo -e "${GREEN}✅ HTTP fallback script created: ./start-dev-http.sh${NC}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ HTTPS DEVELOPMENT SETUP COMPLETE!                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}🎯 What's Been Set Up:${NC}"
echo -e "   ✅ Local Certificate Authority installed in system trust store"
echo -e "   ✅ HTTPS certificates generated for localhost"
echo -e "   ✅ Vite configuration updated for HTTPS"
echo -e "   ✅ Development scripts created"
echo ""

echo -e "${BLUE}📋 Available Commands:${NC}"
echo -e "   🔐 HTTPS Mode (Recommended): ${GREEN}./start-dev-https.sh${NC}"
echo -e "   🌐 HTTP Mode (Fallback):     ${YELLOW}./start-dev-http.sh${NC}"
echo -e "   📦 Full Stack HTTPS:         ${GREEN}./start_full_stack.sh${NC} (will use HTTPS)"
echo ""

echo -e "${BLUE}🔐 HTTPS Benefits:${NC}"
echo -e "   ✅ Web Crypto API available (real encryption)"
echo -e "   ✅ No more 'PLAIN:' prefix warnings"
echo -e "   ✅ Production-like security in development"
echo -e "   ✅ Service Worker support"
echo -e "   ✅ Modern browser API access"
echo ""

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "   1. Run: ${GREEN}./start-dev-https.sh${NC}"
echo -e "   2. Open: ${GREEN}https://localhost:5173${NC}"
echo -e "   3. Test API key save/load (should work without PLAIN: prefix)"
echo -e "   4. Check console for: ${GREEN}\"✅ encryptApiKey: Encryption successful\"${NC}"
echo ""

echo -e "${YELLOW}📝 Note: If you see a security warning in your browser, click 'Advanced' → 'Proceed to localhost' (the certificate is trusted but browsers may show warnings for localhost)${NC}"
echo ""

echo -e "${GREEN}🎉 Ready for secure development!${NC}"