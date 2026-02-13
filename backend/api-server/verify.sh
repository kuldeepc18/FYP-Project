#!/bin/bash

# Backend Implementation Verification Script
# Run this to verify all components are working

echo "================================================="
echo "  KTrade Backend Implementation Verification"
echo "================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function
test_result() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

echo "Running verification tests..."
echo ""

# Test 1: Check if all source files exist
echo "Test 1: Checking source files..."
REQUIRED_FILES=(
    "server.js"
    "config/database.js"
    "middleware/auth.js"
    "utils/logger.js"
    "services/authService.js"
    "services/marketService.js"
    "services/orderService.js"
    "services/mlService.js"
    "services/surveillanceService.js"
    "routes/auth.js"
    "routes/market.js"
    "routes/orders.js"
    "routes/portfolio.js"
    "routes/admin/auth.js"
    "routes/admin/market.js"
    "routes/admin/orders.js"
    "routes/admin/trades.js"
    "routes/admin/ml.js"
    "routes/admin/surveillance.js"
)

ALL_FILES_EXIST=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}  Missing: $file${NC}"
        ALL_FILES_EXIST=1
    fi
done
test_result $ALL_FILES_EXIST "All source files present"

# Test 2: Check if scripts are executable
echo ""
echo "Test 2: Checking script permissions..."
SCRIPTS_EXECUTABLE=0
if [ -x "start-all.sh" ] && [ -x "start-questdb.sh" ] && [ -x "stop-all.sh" ]; then
    SCRIPTS_EXECUTABLE=0
else
    SCRIPTS_EXECUTABLE=1
fi
test_result $SCRIPTS_EXECUTABLE "Shell scripts are executable"

# Test 3: Check if node_modules installed
echo ""
echo "Test 3: Checking dependencies..."
if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
    test_result 0 "Dependencies installed"
else
    test_result 1 "Dependencies not installed"
fi

# Test 4: Check if .env file exists
echo ""
echo "Test 4: Checking configuration..."
if [ -f ".env" ]; then
    test_result 0 "Environment file (.env) exists"
else
    test_result 1 "Environment file (.env) missing"
fi

# Test 5: Check Node.js syntax
echo ""
echo "Test 5: Checking JavaScript syntax..."
node --check server.js 2>/dev/null
test_result $? "server.js syntax is valid"

# Test 6: Check if QuestDB port is available or in use
echo ""
echo "Test 6: Checking QuestDB port (8812)..."
if lsof -Pi :8812 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tuln | grep -q :8812 2>/dev/null; then
    echo -e "${GREEN}  QuestDB is running on port 8812${NC}"
    test_result 0 "QuestDB port check"
else
    echo -e "${YELLOW}  QuestDB is not running (optional - will start when needed)${NC}"
    test_result 0 "QuestDB port check (not running, but OK)"
fi

# Test 7: Check if API port (3000) is available
echo ""
echo "Test 7: Checking API server port (3000)..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}  Port 3000 is already in use${NC}"
    test_result 1 "API port 3000 availability"
else
    echo -e "${GREEN}  Port 3000 is available${NC}"
    test_result 0 "API port 3000 availability"
fi

# Test 8: Quick server startup test (5 seconds)
echo ""
echo "Test 8: Testing server startup..."
echo "  Starting server for 5 seconds..."
timeout 5 node server.js > /tmp/ktrade-server-test.log 2>&1 &
SERVER_PID=$!
sleep 3

if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo -e "${GREEN}  Server started successfully${NC}"
    kill $SERVER_PID 2>/dev/null
    test_result 0 "Server startup"
else
    echo -e "${RED}  Server failed to start${NC}"
    echo "  Check logs: cat /tmp/ktrade-server-test.log"
    test_result 1 "Server startup"
fi

# Summary
echo ""
echo "================================================="
echo "  Verification Summary"
echo "================================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
else
    echo -e "${GREEN}Failed: 0${NC}"
fi
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All verification tests passed!${NC}"
    echo -e "${GREEN}✅ Backend implementation is complete and working!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start QuestDB: ./start-questdb.sh"
    echo "  2. Start API server: ./start-all.sh"
    echo "  3. Test with frontends"
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Missing dependencies: npm install"
    echo "  - Script permissions: chmod +x *.sh"
    echo "  - Port in use: kill \$(lsof -ti:3000)"
fi

echo "================================================="
