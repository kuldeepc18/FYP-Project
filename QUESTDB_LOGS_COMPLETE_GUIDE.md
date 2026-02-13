# 📊 QuestDB Trading Logs - Complete Guide

## ✅ Setup Complete!

I've created **3 different tools** to view QuestDB trading logs on console:

### 🚀 Quick Start (Recommended)

**Use the simple log viewer:**
```bash
cd /home/kuldeep/Desktop/FYP_PROJECT/FYP
./view-logs-simple.sh
```

This will show you a menu to view:
- Table summary (record counts)
- Recent trades
- Recent orders
- All users
- Open/filled orders
- Positions
- Complete logs

---

## 📁 Files Created

### 1. **view-logs-simple.sh** ⭐ *RECOMMENDED*
   - **Easy to use, no dependencies**
   - Just run: `./view-logs-simple.sh`
   - Interactive menu
   - Uses QuestDB HTTP API (port 9000)

### 2. **view-logs-api.sh**
   - Advanced version with jq formatting
   - Requires: `sudo apt install jq`
   - Better formatting

### 3. **view-questdb-logs.sh**
   - Uses PostgreSQL protocol (port 8812)
   - Requires: `sudo apt install postgresql-client`
   - Most features

### 4. **questdb-trading-queries.sql**
   - **20+ pre-written SQL queries**
   - Copy and paste into QuestDB web console
   - Comprehensive query reference

---

## 🔍 Quick Queries (Copy & Paste)

### View All Tables
```sql
SELECT * FROM tables();
```

### View Users
```sql
SELECT id, name, email, balance FROM users;
```

### View Recent Orders
```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;
```

### View Recent Trades
```sql
SELECT * FROM trades ORDER BY executed_at DESC LIMIT 20;
```

### View Positions
```sql
SELECT * FROM positions ORDER BY updated_at DESC;
```

### Get Record Counts
```sql
SELECT 'users' as table, COUNT(*) as count FROM users
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'trades', COUNT(*) FROM trades
UNION ALL SELECT 'positions', COUNT(*) FROM positions;
```

---

## 🌐 QuestDB Web Console

**Easiest way to view logs:**
```
http://localhost:9000
```

This gives you a web interface where you can:
- Run any SQL query
- See results in a table
- Export data as CSV
- View query execution plans

---

## 💻 Command Line Methods

### Method 1: Simple Script (No Dependencies)
```bash
./view-logs-simple.sh
```

### Method 2: Direct curl + python
```bash
curl -s -G "http://localhost:9000/exec" \
  --data-urlencode "query=SELECT * FROM users" \
  | python3 -m json.tool
```

### Method 3: One-liner for specific query
```bash
# View users
curl -s -G "http://localhost:9000/exec" \
  --data-urlencode "query=SELECT * FROM users"

# View orders
curl -s -G "http://localhost:9000/exec" \
  --data-urlencode "query=SELECT * FROM orders LIMIT 10"
```

---

## 📊 Current Database Status

**Tables:**
- ✅ users: 3 records
- ✅ orders: 0 records (no trades yet)
- ✅ trades: 0 records (no matched orders yet)
- ✅ positions: 0 records (no open positions)
- ✅ admin_users: Available
- ✅ surveillance_alerts: Available
- ✅ market_data: Available

**Registered Users:**
1. demo@ktrade.test (Demo account)
2. test@example.com (Test user)
3. testuser@example.com (Another test user)

---

## 🎯 Common Use Cases

### 1. Monitor Trading Activity
```bash
# View recent orders
./view-logs-simple.sh
# Choose option 3
```

### 2. Check User Balances
```bash
# View all users with balances
./view-logs-simple.sh
# Choose option 4
```

### 3. View Matched Trades
```bash
# View executed trades
./view-logs-simple.sh
# Choose option 2
```

### 4. Track Open Orders
```bash
# View open order book
./view-logs-simple.sh
# Choose option 5
```

---

## 🔧 SQL Query Examples

### Find Orders for Specific User
```sql
SELECT * FROM orders 
WHERE user_id = 'USER_ID' 
ORDER BY created_at DESC;
```

### View Trading Volume by Symbol
```sql
SELECT 
    symbol,
    COUNT(*) as trade_count,
    SUM(quantity) as total_quantity,
    AVG(price) as avg_price
FROM trades
GROUP BY symbol
ORDER BY trade_count DESC;
```

### View Order Book for Symbol
```sql
SELECT 
    side,
    price,
    SUM(quantity - filled_quantity) as remaining_qty,
    COUNT(*) as order_count
FROM orders
WHERE symbol = 'RELIANCE' AND status = 'OPEN'
GROUP BY side, price
ORDER BY price DESC;
```

### User P&L Summary
```sql
SELECT 
    user_id,
    SUM(unrealized_pnl) as total_unrealized,
    SUM(realized_pnl) as total_realized,
    SUM(unrealized_pnl + realized_pnl) as total_pnl
FROM positions
GROUP BY user_id;
```

---

## 📝 Database Schema

### Tables Structure

**users**
- id, email, password_hash, name, balance
- created_at, updated_at

**orders**
- id, user_id, symbol, side, type
- quantity, price, stop_price, status
- filled_quantity, average_price, fees
- created_at, filled_at, cancelled_at

**trades**
- id, buy_order_id, sell_order_id
- symbol, price, quantity
- buyer_user_id, seller_user_id
- executed_at

**positions**
- id, user_id, symbol, quantity
- average_price, current_price
- unrealized_pnl, realized_pnl
- updated_at

---

## 🚨 Troubleshooting

### "Cannot connect to QuestDB"
```bash
# Check if QuestDB is running
lsof -i:9000
lsof -i:8812

# If not running, check backend logs
tail -f backend/api-server/logs/*.log
```

### "No data in tables"
- This is normal if no trading has happened yet
- Users need to place orders through the UI
- Orders will appear in the database immediately
- Matched orders create trades

### Need to install tools?
```bash
# For psql method
sudo apt install postgresql-client

# For jq method
sudo apt install jq

# For simple method (already works!)
# No dependencies needed - just Python 3
```

---

## 💡 Pro Tips

1. **Web Console is Easiest**: http://localhost:9000
   - No installation needed
   - Visual query builder
   - Export results

2. **Use LIMIT**: Always add `LIMIT` to queries
   ```sql
   SELECT * FROM orders LIMIT 100;
   ```

3. **Recent Data**: Filter by time
   ```sql
   WHERE created_at > dateadd('h', -1, now())
   ```

4. **Watch Live**: Create a monitoring query
   ```bash
   watch -n 5 './view-logs-simple.sh <<< "1"'
   ```

---

## 📚 Additional Resources

**All Files:**
- `questdb-trading-queries.sql` - 20+ SQL queries
- `view-logs-simple.sh` - Simple console viewer ⭐
- `view-logs-api.sh` - Advanced viewer (needs jq)
- `view-questdb-logs.sh` - psql-based viewer
- `QUESTDB_LOGS_GUIDE.md` - Full documentation

**QuestDB Documentation:**
- Official Docs: https://questdb.io/docs/
- SQL Reference: https://questdb.io/docs/reference/sql/
- HTTP API: https://questdb.io/docs/reference/api/rest/

---

## ✅ Summary

**To view trading logs on console:**

```bash
# Easiest way - Run the simple viewer
./view-logs-simple.sh

# Or open web console
Open: http://localhost:9000

# Or run quick query
curl -s -G "http://localhost:9000/exec" \
  --data-urlencode "query=SELECT * FROM users" \
  | python3 -m json.tool
```

**What you can see:**
- ✅ All registered users
- ✅ Trading orders (buy/sell)
- ✅ Executed trades
- ✅ User positions
- ✅ Balances and P&L
- ✅ Market surveillance alerts

---

**Status**: ✅ ALL TOOLS READY  
**Date**: February 14, 2026  
**QuestDB**: Running on ports 8812 (PostgreSQL) and 9000 (HTTP)

🎉 **You're all set to view trading logs!**
