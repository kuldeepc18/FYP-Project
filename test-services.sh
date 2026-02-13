#!/bin/bash

echo "================================================"
echo "  KTrade Platform - Quick Verification Test"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Backend
echo -n "Testing Backend API (port 3000)... "
BACKEND=$(curl -s -m 2 http://localhost:3000/health 2>/dev/null)
if [[ $BACKEND == *"ok"* ]]; then
    echo -e "${GREEN}✓ WORKING${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test User Frontend
echo -n "Testing User Frontend (port 8080)... "
USER_FRONTEND=$(curl -s -I -m 2 http://localhost:8080 2>&1 | grep "HTTP")
if [[ $USER_FRONTEND == *"200"* ]]; then
    echo -e "${GREEN}✓ WORKING${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test Admin Frontend
echo -n "Testing Admin Frontend (port 5174)... "
ADMIN_FRONTEND=$(curl -s -I -m 2 http://localhost:5174 2>&1 | grep "HTTP")
if [[ $ADMIN_FRONTEND == *"200"* ]]; then
    echo -e "${GREEN}✓ WORKING${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test Market Data
echo -n "Testing Market Data API... "
MARKET_DATA=$(curl -s -m 2 http://localhost:3000/api/market/quotes 2>/dev/null)
INSTRUMENT_COUNT=$(echo "$MARKET_DATA" | grep -o "symbol" | wc -l)
if [ "$INSTRUMENT_COUNT" -gt 10 ]; then
    echo -e "${GREEN}✓ WORKING ($INSTRUMENT_COUNT instruments)${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test Registration Endpoint
echo -n "Testing Registration Endpoint... "
REG_TEST=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser_'$(date +%s)'@example.com","password":"test123","name":"Test User"}' 2>/dev/null)
if [[ $REG_TEST == *"token"* ]] || [[ $REG_TEST == *"exists"* ]]; then
    echo -e "${GREEN}✓ WORKING${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

# Test Admin Login
echo -n "Testing Admin Login... "
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sentinel.com","password":"admin123"}' 2>/dev/null)
if [[ $ADMIN_LOGIN == *"token"* ]]; then
    echo -e "${GREEN}✓ WORKING${NC}"
else
    echo -e "${RED}✗ FAILED${NC}"
fi

echo ""
echo "================================================"
echo "  Test Complete"
echo "================================================"
echo ""
echo -e "${YELLOW}Access URLs:${NC}"
echo "  • User Frontend:  http://localhost:8080"
echo "  • Admin Frontend: http://localhost:5174"
echo "  • Backend API:    http://localhost:3000"
echo ""
echo -e "${YELLOW}Demo Credentials:${NC}"
echo "  • User:  demo@ktrade.test / demo123"
echo "  • Admin: admin@sentinel.com / admin123"
echo ""
echo -e "${YELLOW}Registration:${NC}"
echo "  • Go to: http://localhost:8080/auth/register"
echo "  • Create new account with any email/password"
echo ""
