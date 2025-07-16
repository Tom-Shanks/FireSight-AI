#!/bin/bash

# FireSight AI Colorado - Quick Deploy Script
# This script helps deploy the Colorado-specific enhancements

echo "🔥 FireSight AI Colorado - Deployment Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check for npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd frontend
if npm install; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo "Please run 'npm install' manually in the frontend directory"
    exit 1
fi

# Step 2: Build the React app
echo ""
echo -e "${YELLOW}🔨 Building React app...${NC}"
if npm run build; then
    echo -e "${GREEN}✅ React app built successfully${NC}"
else
    echo -e "${RED}❌ Failed to build React app${NC}"
    echo "Please run 'npm run build' manually in the frontend directory"
    exit 1
fi

# Step 3: Copy build to root
echo ""
echo -e "${YELLOW}📂 Copying build files...${NC}"
cd ..
if [ -d "react-app" ]; then
    rm -rf react-app
fi
cp -r frontend/build react-app
echo -e "${GREEN}✅ Build files copied to /react-app${NC}"

# Step 4: Update iframe paths in index.html
echo ""
echo -e "${YELLOW}🔧 Updating iframe paths...${NC}"
if [ -f "index.html" ]; then
    # Update iframe src paths
    sed -i.bak 's|src="/frontend/build/"|src="./react-app/"|g' index.html
    sed -i.bak 's|href="/frontend/build/"|href="./react-app/"|g' index.html
    echo -e "${GREEN}✅ Paths updated in index.html${NC}"
else
    echo -e "${RED}❌ index.html not found${NC}"
fi

# Step 5: Create a simple test server script
echo ""
echo -e "${YELLOW}🖥️  Creating test server...${NC}"
cat > test-server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8000

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"🚀 Server running at http://localhost:{PORT}/")
    print("📍 Colorado FireSight AI is ready!")
    print("Press Ctrl+C to stop")
    httpd.serve_forever()
EOF

chmod +x test-server.py
echo -e "${GREEN}✅ Test server created${NC}"

# Step 6: Final instructions
echo ""
echo -e "${GREEN}🎉 Deployment preparation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Test locally: python3 test-server.py"
echo "2. Visit: http://localhost:8000"
echo "3. When ready to deploy:"
echo "   git add ."
echo "   git commit -m 'Deploy Colorado wildfire monitoring system'"
echo "   git push origin main"
echo ""
echo "4. Enable GitHub Pages:"
echo "   - Go to Settings → Pages"
echo "   - Source: Deploy from branch"
echo "   - Branch: main, folder: / (root)"
echo ""
echo -e "${YELLOW}🚁 Ready to show Colorado employers your value!${NC}"
echo -e "${GREEN}💰 Remember: You're offering $125,000+ in annual savings!${NC}"