#!/bin/bash

# QuestDB Trading Log Viewer
# Quick console viewer for trading logs

echo "================================================"
echo "  QuestDB Trading Log Viewer"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: psql not found. Installing...${NC}"
    echo "Run: sudo apt-get install postgresql-client"
    exit 1
fi

# QuestDB connection details
HOST="localhost"
PORT="8812"
USER="kuldeep"
DB="qdb"

echo -e "${BLUE}Connecting to QuestDB...${NC}"
echo "Host: $HOST:$PORT"
echo "Database: $DB"
echo "User: $USER"
echo ""

# Function to run query and display
run_query() {
    local TITLE=$1
    local QUERY=$2
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$TITLE${NC}"
    echo -e "${GREEN}========================================${NC}"
    PGPASSWORD="fyp@123" psql -h $HOST -p $PORT -U $USER -d $DB -c "$QUERY"
}

# Menu
echo "Select what you want to view:"
echo "  1) Recent Trades (Last 20)"
echo "  2) Recent Orders (Last 20)"
echo "  3) Open Orders"
echo "  4) User List with Balances"
echo "  5) Trading Volume by Symbol"
echo "  6) Daily Trading Summary"
echo "  7) All Positions"
echo "  8) Surveillance Alerts"
echo "  9) Tables Summary (Record Counts)"
echo "  10) Live Monitor (Real-time orders)"
echo "  11) ALL LOGS (Full view)"
echo "  0) Custom Query"
echo ""
read -p "Enter your choice (1-11): " choice

case $choice in
    1)
        run_query "RECENT TRADES (Last 20)" "
            SELECT 
                id,
                symbol,
                price,
                quantity,
                price * quantity as total_value,
                buyer_user_id,
                seller_user_id,
                executed_at
            FROM trades
            ORDER BY executed_at DESC
            LIMIT 20;
        "
        ;;
    2)
        run_query "RECENT ORDERS (Last 20)" "
            SELECT 
                id,
                user_id,
                symbol,
                side,
                type,
                quantity,
                price,
                status,
                filled_quantity,
                created_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 20;
        "
        ;;
    3)
        run_query "OPEN ORDERS" "
            SELECT * FROM orders 
            WHERE status = 'OPEN' 
            ORDER BY created_at DESC;
        "
        ;;
    4)
        run_query "USER LIST WITH BALANCES" "
            SELECT 
                id,
                name,
                email,
                balance,
                created_at
            FROM users
            ORDER BY created_at DESC;
        "
        ;;
    5)
        run_query "TRADING VOLUME BY SYMBOL (Last 24h)" "
            SELECT 
                symbol,
                COUNT(*) as trade_count,
                SUM(quantity) as total_qty,
                SUM(price * quantity) as total_value,
                AVG(price) as avg_price
            FROM trades
            WHERE executed_at > dateadd('d', -1, now())
            GROUP BY symbol
            ORDER BY total_value DESC;
        "
        ;;
    6)
        run_query "DAILY TRADING SUMMARY (Last 7 days)" "
            SELECT 
                to_str(executed_at, 'yyyy-MM-dd') as date,
                COUNT(*) as trades,
                SUM(quantity) as total_qty,
                SUM(price * quantity) as total_value
            FROM trades
            WHERE executed_at > dateadd('d', -7, now())
            GROUP BY date
            ORDER BY date DESC;
        "
        ;;
    7)
        run_query "ALL POSITIONS" "
            SELECT 
                user_id,
                symbol,
                quantity,
                average_price,
                current_price,
                unrealized_pnl,
                updated_at
            FROM positions
            ORDER BY updated_at DESC;
        "
        ;;
    8)
        run_query "SURVEILLANCE ALERTS" "
            SELECT 
                id,
                type,
                severity,
                symbol,
                description,
                status,
                detected_at
            FROM surveillance_alerts
            ORDER BY detected_at DESC
            LIMIT 20;
        "
        ;;
    9)
        run_query "TABLES SUMMARY - RECORD COUNTS" "
            SELECT 'users' as table_name, COUNT(*) as records FROM users
            UNION ALL
            SELECT 'orders', COUNT(*) FROM orders
            UNION ALL
            SELECT 'trades', COUNT(*) FROM trades
            UNION ALL
            SELECT 'positions', COUNT(*) FROM positions
            UNION ALL
            SELECT 'admin_users', COUNT(*) FROM admin_users
            UNION ALL
            SELECT 'surveillance_alerts', COUNT(*) FROM surveillance_alerts;
        "
        ;;
    10)
        echo -e "${YELLOW}Live Monitor - Press Ctrl+C to stop${NC}"
        while true; do
            clear
            run_query "LIVE ORDERS (Last 5 minutes)" "
                SELECT 
                    symbol,
                    side,
                    status,
                    COUNT(*) as count,
                    SUM(quantity) as total_qty
                FROM orders
                WHERE created_at > dateadd('m', -5, now())
                GROUP BY symbol, side, status
                ORDER BY symbol, side;
            "
            
            run_query "RECENT TRADES (Last 5 minutes)" "
                SELECT * FROM trades 
                WHERE executed_at > dateadd('m', -5, now())
                ORDER BY executed_at DESC
                LIMIT 10;
            "
            sleep 5
        done
        ;;
    11)
        echo -e "${YELLOW}Showing ALL LOGS...${NC}"
        run_query "ALL USERS" "SELECT * FROM users ORDER BY created_at DESC;"
        run_query "ALL ORDERS" "SELECT * FROM orders ORDER BY created_at DESC LIMIT 50;"
        run_query "ALL TRADES" "SELECT * FROM trades ORDER BY executed_at DESC LIMIT 50;"
        run_query "ALL POSITIONS" "SELECT * FROM positions ORDER BY updated_at DESC;"
        ;;
    0)
        echo ""
        echo "Enter your custom SQL query (end with semicolon):"
        read -p "> " custom_query
        run_query "CUSTOM QUERY RESULT" "$custom_query"
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""
echo "To open interactive QuestDB console, run:"
echo "  PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb"
echo ""
