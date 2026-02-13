#!/bin/bash

# Stop all KTrade services

echo "Stopping KTrade services..."

# Stop API Server
echo "Stopping API server..."
pkill -f "node server.js" && echo "✅ API server stopped" || echo "ℹ️  API server was not running"

# Stop QuestDB
echo "Stopping QuestDB..."
if [ -f "$HOME/questdb/bin/questdb.sh" ]; then
    cd "$HOME/questdb" && ./bin/questdb.sh stop && echo "✅ QuestDB stopped"
elif command -v questdb >/dev/null 2>&1; then
    questdb stop && echo "✅ QuestDB stopped"
else
    pkill -f "questdb" && echo "✅ QuestDB stopped" || echo "ℹ️  QuestDB was not running"
fi

echo ""
echo "All services stopped."
