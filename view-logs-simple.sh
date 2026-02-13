#!/bin/bash

# Simple QuestDB Log Viewer - No dependencies required!
# Uses QuestDB's HTTP API

clear
echo "================================================"
echo "  QuestDB Trading Logs - Simple Viewer"
echo "================================================"
echo ""

QUESTDB="http://localhost:9000/exec"

# Check connection
if ! curl -s -m 2 "$QUESTDB?query=SELECT%201" > /dev/null 2>&1; then
    echo "❌ ERROR: Cannot connect to QuestDB!"
    echo ""
    echo "Make sure QuestDB is running:"
    echo "  lsof -i:9000"
    echo ""
    exit 1
fi

echo "✅ Connected to QuestDB"
echo ""

# Function to execute query and show results
show_logs() {
    local QUERY=$1
    echo "$QUERY" | sed 's/^ *//g'
    echo "---"
    curl -s -G "$QUESTDB" --data-urlencode "query=$QUERY" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    if 'dataset' in data:
        # Print headers
        headers = [col['name'] for col in data['columns']]
        print(' | '.join(headers))
        print('-' * 80)
        # Print rows
        for row in data['dataset']:
            print(' | '.join(str(val) if val is not None else 'NULL' for val in row))
        print()
        print(f'Total rows: {len(data[\"dataset\"])}')
    elif 'error' in data:
        print(f'ERROR: {data[\"error\"]}')
    else:
        print('No data')
except Exception as e:
    print(f'Error parsing response: {e}')
    print(sys.stdin.read())
"
    echo ""
    echo ""
}

# Main Menu
echo "=== TRADING LOGS MENU ==="
echo ""
echo "1) Table Summary (Record Counts)"
echo "2) Recent Trades (Last 10)"
echo "3) Recent Orders (Last 10)"
echo "4) All Users"
echo "5) Open Orders"
echo "6) Filled Orders (Last 10)"
echo "7) All Positions"
echo "8) Show ALL Logs"
echo ""
read -p "Enter choice (1-8): " CHOICE

echo ""
case $CHOICE in
    1)
        echo "📊 TABLE SUMMARY"
        echo "================"
        show_logs "SELECT 'users' as table_name, COUNT(*) as records FROM users
                   UNION ALL SELECT 'orders', COUNT(*) FROM orders
                   UNION ALL SELECT 'trades', COUNT(*) FROM trades
                   UNION ALL SELECT 'positions', COUNT(*) FROM positions
                   UNION ALL SELECT 'admin_users', COUNT(*) FROM admin_users"
        ;;
    2)
        echo "💰 RECENT TRADES (Last 10)"
        echo "=========================="
        show_logs "SELECT id, symbol, price, quantity, buyer_user_id, seller_user_id, executed_at 
                   FROM trades ORDER BY executed_at DESC LIMIT 10"
        ;;
    3)
        echo "📋 RECENT ORDERS (Last 10)"
        echo "=========================="
        show_logs "SELECT id, user_id, symbol, side, type, quantity, price, status, created_at 
                   FROM orders ORDER BY created_at DESC LIMIT 10"
        ;;
    4)
        echo "👥 ALL USERS"
        echo "============"
        show_logs "SELECT id, name, email, balance, created_at FROM users ORDER BY created_at DESC"
        ;;
    5)
        echo "📂 OPEN ORDERS"
        echo "=============="
        show_logs "SELECT id, user_id, symbol, side, price, quantity, created_at 
                   FROM orders WHERE status = 'OPEN' ORDER BY created_at DESC"
        ;;
    6)
        echo "✅ FILLED ORDERS (Last 10)"
        echo "========================="
        show_logs "SELECT id, user_id, symbol, side, quantity, price, filled_quantity, average_price, filled_at 
                   FROM orders WHERE status = 'FILLED' ORDER BY filled_at DESC LIMIT 10"
        ;;
    7)
        echo "📊 ALL POSITIONS"
        echo "================"
        show_logs "SELECT user_id, symbol, quantity, average_price, current_price, unrealized_pnl, updated_at 
                   FROM positions ORDER BY updated_at DESC"
        ;;
    8)
        echo "📚 ALL LOGS"
        echo "==========="
        
        echo ""
        echo "--- USERS ---"
        show_logs "SELECT * FROM users ORDER BY created_at DESC"
        
        echo "--- ORDERS ---"
        show_logs "SELECT * FROM orders ORDER BY created_at DESC LIMIT 20"
        
        echo "--- TRADES ---"
        show_logs "SELECT * FROM trades ORDER BY executed_at DESC LIMIT 20"
        
        echo "--- POSITIONS ---"
        show_logs "SELECT * FROM positions ORDER BY updated_at DESC"
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo "================================================"
echo "✅ Done!"
echo ""
echo "💡 Tips:"
echo "  • QuestDB Web Console: http://localhost:9000"
echo "  • Run this script again for more queries"
echo "  • Edit this script to add custom queries"
echo ""
