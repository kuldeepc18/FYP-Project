# QuestDB Trading Logs - Quick Reference Guide

## 📊 How to View Trading Logs

### Method 1: Interactive Script (Recommended)
Run the interactive log viewer:
```bash
cd /home/kuldeep/Desktop/FYP_PROJECT/FYP
./view-questdb-logs.sh
```

This will show a menu with options to view:
- Recent Trades
- Recent Orders
- Open Orders
- User Balances
- Trading Volume
- And more...

### Method 2: Direct psql Connection
Connect directly to QuestDB console:
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb
```

Then run any SQL query from `questdb-trading-queries.sql`

### Method 3: One-Line Quick Queries

**View Recent Trades:**
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb -c "SELECT * FROM trades ORDER BY executed_at DESC LIMIT 20;"
```

**View Recent Orders:**
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb -c "SELECT * FROM orders ORDER BY created_at DESC LIMIT 20;"
```

**View All Users:**
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb -c "SELECT id, name, email, balance FROM users;"
```

**View Open Orders:**
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb -c "SELECT * FROM orders WHERE status = 'OPEN' ORDER BY created_at DESC;"
```

**View Trading Summary:**
```bash
PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb -c "SELECT 'users' as table_name, COUNT(*) as records FROM users UNION ALL SELECT 'orders', COUNT(*) FROM orders UNION ALL SELECT 'trades', COUNT(*) FROM trades;"
```

---

## 📋 Database Tables

Your QuestDB has 7 main tables:

1. **users** - All registered users with balances
2. **orders** - All buy/sell orders
3. **trades** - Executed trades (matched orders)
4. **positions** - Users' current holdings
5. **admin_users** - Admin accounts
6. **surveillance_alerts** - Trading pattern alerts
7. **market_data** - Market price data cache

---

## 🔍 Most Useful Queries

### View Last 20 Trades
```sql
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
```

### View Order Book for a Symbol
```sql
SELECT 
    side,
    price,
    SUM(quantity - filled_quantity) as total_quantity,
    COUNT(*) as order_count
FROM orders
WHERE symbol = 'RELIANCE' 
AND status = 'OPEN'
GROUP BY side, price
ORDER BY side, price DESC;
```

### View User Trading Activity
```sql
-- Replace USER123 with actual user ID
SELECT * FROM orders 
WHERE user_id = 'USER123' 
ORDER BY created_at DESC;
```

### View Trading Volume by Symbol (Last 24h)
```sql
SELECT 
    symbol,
    COUNT(*) as trade_count,
    SUM(quantity) as total_quantity,
    SUM(price * quantity) as total_value,
    AVG(price) as avg_price
FROM trades
WHERE executed_at > dateadd('d', -1, now())
GROUP BY symbol
ORDER BY total_value DESC;
```

---

## 🚀 Quick Start

1. **Make sure QuestDB is running:**
   ```bash
   # Check if QuestDB is running
   lsof -i:8812
   ```

2. **Run the log viewer:**
   ```bash
   ./view-questdb-logs.sh
   ```

3. **Or connect directly:**
   ```bash
   PGPASSWORD='fyp@123' psql -h localhost -p 8812 -U kuldeep -d qdb
   ```

---

## 📝 Connection Details

- **Host:** localhost
- **Port:** 8812
- **Username:** kuldeep
- **Password:** fyp@123
- **Database:** qdb

---

## 🔧 Troubleshooting

**If you can't connect:**
1. Check if QuestDB is running: `lsof -i:8812`
2. Start QuestDB if needed: `./start-questdb.sh`
3. Check backend logs: `tail -f backend/api-server/logs/*.log`

**If psql is not installed:**
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

---

## 📚 Full Query Reference

All comprehensive queries are available in:
`questdb-trading-queries.sql`

This file contains 20+ pre-written queries for:
- Trade analysis
- Order monitoring
- User activity
- Volume analysis
- Position tracking
- Surveillance alerts
- And more!

---

## 💡 Tips

- Use `LIMIT` to limit results for large tables
- Use `ORDER BY ... DESC` to see most recent records first
- Use `WHERE created_at > dateadd('d', -1, now())` to filter last 24 hours
- Press `Ctrl+C` to exit live monitor mode
- Press `q` to exit psql pager view

---

**Files Created:**
- `questdb-trading-queries.sql` - All SQL queries
- `view-questdb-logs.sh` - Interactive log viewer script
- `QUESTDB_LOGS_GUIDE.md` - This guide
