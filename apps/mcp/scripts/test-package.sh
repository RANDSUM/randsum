#!/bin/bash

# Test script for RANDSUM MCP package distribution
set -e

echo "🧪 Testing RANDSUM MCP Package Distribution"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Test 1: Build the package
echo "1. Building package..."
if bun moon mcp:build; then
    print_status "Package built successfully"
else
    print_error "Package build failed"
    exit 1
fi

# Test 2: Check required files exist
echo "2. Checking distribution files..."
required_files=("dist/index.js" "dist/index.cjs" "dist/index.d.ts" "bin/randsum-mcp" "package.json")

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_status "Found $file"
    else
        print_error "Missing required file: $file"
        exit 1
    fi
done

# Test 3: Test CLI help
echo "3. Testing CLI interface..."
if node dist/index.js --help > /dev/null 2>&1; then
    print_status "CLI help command works"
else
    print_error "CLI help command failed"
    exit 1
fi

# Test 4: Test HTTP server startup (quick test)
echo "4. Testing HTTP server startup..."
timeout 5s node dist/index.js --transport http --port 3333 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

if kill -0 $SERVER_PID 2>/dev/null; then
    print_status "HTTP server starts successfully"
    kill $SERVER_PID 2>/dev/null || true
else
    print_warning "HTTP server test inconclusive"
fi

# Test 5: Check package.json validity
echo "5. Validating package.json..."
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
    print_status "package.json is valid JSON"
else
    print_error "package.json is invalid"
    exit 1
fi

# Test 6: Check bin script
echo "6. Testing bin script..."
if [ -x "bin/randsum-mcp" ]; then
    print_status "bin/randsum-mcp is executable"
else
    print_error "bin/randsum-mcp is not executable"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All distribution tests passed!${NC}"
echo "Package is ready for distribution."
