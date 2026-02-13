#!/bin/bash

# QuestDB Startup Script for KTrade API Server

echo "========================================="
echo "QuestDB Setup & Startup"
echo "========================================="
echo ""

# Check if QuestDB is installed
if [ ! -d "$HOME/.questdb" ]; then
    echo "❌ QuestDB not found in $HOME/.questdb"
    echo ""
    echo "To install QuestDB, visit: https://questdb.io/get-questdb/"
    echo "Or install via package manager:"
    echo "  wget https://github.com/questdb/questdb/releases/download/7.3.10/questdb-7.3.10-rt-linux-amd64.tar.gz"
    echo "  tar -xzf questdb-7.3.10-rt-linux-amd64.tar.gz"
    echo "  cd questdb-7.3.10-rt-linux-amd64"
    echo "  ./questdb.sh start"
    exit 1
fi

# Check if QuestDB is already running
if lsof -Pi :8812 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tuln | grep -q :8812 2>/dev/null; then
    echo "✅ QuestDB is already running on port 8812"
    echo ""
    echo "Web Console: http://localhost:9000"
    echo "PostgreSQL Wire Protocol: localhost:8812"
    echo ""
else
    echo "🚀 Starting QuestDB..."
    echo ""
    
    # Try to find and start QuestDB
    if [ -f "$HOME/questdb/bin/questdb.sh" ]; then
        cd "$HOME/questdb" && ./bin/questdb.sh start
    elif [ -f "/opt/questdb/bin/questdb.sh" ]; then
        cd /opt/questdb && ./bin/questdb.sh start
    elif command -v questdb >/dev/null 2>&1; then
        questdb start
    else
        echo "❌ Could not find QuestDB executable"
        echo ""
        echo "Please start QuestDB manually:"
        echo "  1. Navigate to your QuestDB installation directory"
        echo "  2. Run: ./bin/questdb.sh start"
        echo "  3. Or run: java -jar questdb.jar"
        exit 1
    fi
    
    # Wait for QuestDB to start
    echo "⏳ Waiting for QuestDB to start..."
    sleep 3
    
    # Check if it started successfully
    if lsof -Pi :8812 -sTCP:LISTEN -t >/dev/null 2>&1 || ss -tuln | grep -q :8812 2>/dev/null; then
        echo "✅ QuestDB started successfully!"
        echo ""
        echo "Web Console: http://localhost:9000"
        echo "PostgreSQL Wire Protocol: localhost:8812"
        echo ""
    else
        echo "⚠️  QuestDB may not have started successfully"
        echo "Please check manually: http://localhost:9000"
        echo ""
    fi
fi

echo "========================================="
echo "You can now start the API server:"
echo "  npm start       (production)"
echo "  npm run dev     (development)"
echo "========================================="
