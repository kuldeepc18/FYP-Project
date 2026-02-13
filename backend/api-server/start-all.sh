#!/bin/bash

# Complete Startup Script for KTrade Trading Platform
# This script starts QuestDB and the API server

set -e

echo "========================================="
echo "  KTrade Trading Platform Startup"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tuln | grep -q :$1 2>/dev/null
}

# Step 1: Check QuestDB
echo "Step 1: Checking QuestDB..."
if check_port 8812; then
    echo -e "${GREEN}✅ QuestDB is already running${NC}"
else
    echo -e "${YELLOW}⚠️  QuestDB is not running${NC}"
    echo "Attempting to start QuestDB..."
    
    # Try to find and start QuestDB
    if [ -f "$HOME/questdb/bin/questdb.sh" ]; then
        cd "$HOME/questdb" && ./bin/questdb.sh start &
        echo "Started QuestDB from $HOME/questdb"
    elif command -v questdb >/dev/null 2>&1; then
        questdb start &
        echo "Started QuestDB using questdb command"
    else
        echo -e "${RED}❌ Could not start QuestDB automatically${NC}"
        echo "Please start QuestDB manually:"
        echo "  cd ~/questdb && ./bin/questdb.sh start"
        echo ""
        read -p "Press Enter once QuestDB is started..."
    fi
    
    # Wait for QuestDB to start
    echo "Waiting for QuestDB to start..."
    for i in {1..30}; do
        if check_port 8812; then
            echo -e "${GREEN}✅ QuestDB started successfully${NC}"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

echo ""
echo "QuestDB Status:"
echo "  Web Console: http://localhost:9000"
echo "  PostgreSQL Wire Protocol: localhost:8812"
echo ""

# Step 2: Start API Server
echo "Step 2: Starting API Server..."
cd "$(dirname "$0")"

if check_port 3000; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "Stopping existing API server..."
    pkill -f "node server.js" || true
    sleep 2
fi

echo "Starting API server on http://localhost:3000..."
node server.js &
API_PID=$!

# Wait for API server to start
sleep 3

if check_port 3000; then
    echo -e "${GREEN}✅ API Server started successfully${NC}"
    echo ""
    echo "========================================="
    echo "  🚀 KTrade Platform is READY!"
    echo "========================================="
    echo ""
    echo "API Server: http://localhost:3000"
    echo "WebSocket: ws://localhost:3000"
    echo "QuestDB Console: http://localhost:9000"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Email: admin@sentinel.com"
    echo "  Password: admin123"
    echo ""
    echo "To stop all services:"
    echo "  ./stop-all.sh"
    echo ""
    echo "Press Ctrl+C to stop the API server..."
    echo "========================================="
    
    # Wait for the API server process
    wait $API_PID
else
    echo -e "${RED}❌ Failed to start API server${NC}"
    exit 1
fi
