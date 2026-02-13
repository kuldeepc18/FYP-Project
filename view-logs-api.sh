#!/bin/bash

# QuestDB Trading Log Viewer (Using REST API - No psql required!)
# Works with QuestDB's HTTP API on port 9000

echo "================================================"
echo "  QuestDB Trading Log Viewer (HTTP API)"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# QuestDB HTTP API endpoint
QUESTDB_URL="http://localhost:9000/exec"

# Check if QuestDB is running
if ! curl -s -o /dev/null -w "%{http_code}" "$QUESTDB_URL?query=SELECT%201" | grep -q "200"; then
    echo -e "${RED}Error: Cannot connect to QuestDB!${NC}"
    echo "Make sure QuestDB is running:"
    echo "  lsof -i:9000"
    exit 1
fi

echo -e "${GREEN}✓ Connected to QuestDB${NC}"
echo ""

# Function to run query via HTTP API
run_query() {
    local TITLE=$1
    local QUERY=$2
    
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$TITLE${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    # Encode query for URL
    local ENCODED_QUERY=$(echo "$QUERY" | jq -sRr @uri)
    
    # Execute query and format output
    curl -s -G "$QUESTDB_URL" --data-urlencode "query=$QUERY" | jq -r '
        if .dataset then
            # Print column headers
            (.columns | map(.name) | @csv),
            # Print data rows
            (.dataset[] | @csv)
        elif .error then
            "ERROR: " + .error
        else
            "No data returned"
        end
    ' | column -t -s','
    
    echo ""
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: 'jq' not found. Installing...${NC}"
    echo "Run: sudo apt-get install jq"
    echo ""
    echo "For now, here's the raw API call syntax:"
    echo "  curl -G '$QUESTDB_URL' --data-urlencode 'query=SELECT * FROM trades LIMIT 10'"
    exit 1
fi

# Menu
echo "Select what you want to view:"
echo "  1) Record Counts (Tables Summary)"
echo "  2) Recent Trades (Last 20)"
echo "  3) Recent Orders (Last 20)"
echo "  4) Open Orders"
echo "  5) User List with Balances"
echo "  6) All Positions"
echo "  7) Recent Orders by Symbol"
echo "  8) Custom Query"
echo ""
read -p "Enter your choice (1-8): " choice

case $choice in
    1)
        run_query "TABLE RECORD COUNTS" "
            SELECT 'users' as table_name, COUNT(*) as records FROM users
            UNION ALL
            SELECT 'orders', COUNT(*) FROM orders
            UNION ALL
            SELECT 'trades', COUNT(*) FROM trades
            UNION ALL
            SELECT 'positions', COUNT(*) FROM positions
            UNION ALL
            SELECT 'admin_users', COUNT(*) FROM admin_users
        "
        ;;
    2)
        run_query "RECENT TRADES (Last 20)" "
            SELECT 
                id,
                symbol,
                price,
                quantity,
                buyer_user_id,
                seller_user_id,
                executed_at
            FROM trades
            ORDER BY executed_at DESC
            LIMIT 20
        "
        ;;
    3)
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
            LIMIT 20
        "
        ;;
    4)
        run_query "OPEN ORDERS" "
            SELECT 
                id,
                user_id,
                symbol,
                side,
                price,
                quantity,
                created_at
            FROM orders 
            WHERE status = 'OPEN' 
            ORDER BY created_at DESC
        "
        ;;
    5)
        run_query "USER LIST WITH BALANCES" "
            SELECT 
                id,
                name,
                email,
                balance,
                created_at
            FROM users
            ORDER BY created_at DESC
        "
        ;;
    6)
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
            ORDER BY updated_at DESC
        "
        ;;
    7)
        echo ""
        read -p "Enter symbol (e.g., RELIANCE): " SYMBOL
        run_query "ORDERS FOR $SYMBOL" "
            SELECT 
                id,
                user_id,
                side,
                type,
                quantity,
                price,
                status,
                created_at
            FROM orders 
            WHERE symbol = '$SYMBOL'
            ORDER BY created_at DESC
            LIMIT 20
        "
        ;;
    8)
        echo ""
        echo "Enter your SQL query:"
        read -p "> " custom_query
        run_query "CUSTOM QUERY RESULT" "$custom_query"
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo -e "${GREEN}Done!${NC}"
echo ""
echo "QuestDB Web Console: http://localhost:9000"
echo ""
