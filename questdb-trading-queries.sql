-- QuestDB Trading Log Queries
-- Connect to QuestDB and run these queries to view trading logs
-- Connection: psql -h localhost -p 8812 -U kuldeep -d qdb

-- ============================================
-- 1. VIEW ALL TABLES IN DATABASE
-- ============================================
SELECT * FROM tables();

-- ============================================
-- 2. RECENT TRADES (Last 50)
-- ============================================
-- Shows all executed trades with buyer/seller info
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
LIMIT 50;

-- ============================================
-- 3. RECENT ORDERS (Last 100)
-- ============================================
-- Shows all orders with their status
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
    average_price,
    fees,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 100;

-- ============================================
-- 4. ORDERS BY STATUS
-- ============================================
-- View orders by their current status

-- Open Orders
SELECT * FROM orders WHERE status = 'OPEN' ORDER BY created_at DESC;

-- Filled Orders
SELECT * FROM orders WHERE status = 'FILLED' ORDER BY filled_at DESC LIMIT 50;

-- Cancelled Orders  
SELECT * FROM orders WHERE status = 'CANCELLED' ORDER BY cancelled_at DESC LIMIT 50;

-- Pending Orders
SELECT * FROM orders WHERE status = 'PENDING' ORDER BY created_at DESC;

-- ============================================
-- 5. TRADES BY SYMBOL
-- ============================================
-- View trades for specific instruments

-- All trades for RELIANCE
SELECT * FROM trades WHERE symbol = 'RELIANCE' ORDER BY executed_at DESC LIMIT 50;

-- All trades for TCS
SELECT * FROM trades WHERE symbol = 'TCS' ORDER BY executed_at DESC LIMIT 50;

-- ============================================
-- 6. USER TRADING ACTIVITY
-- ============================================
-- View trading activity for a specific user (replace USER_ID)

-- User's orders
SELECT * FROM orders WHERE user_id = 'USER123' ORDER BY created_at DESC;

-- User's trades
SELECT * FROM trades 
WHERE buyer_user_id = 'USER123' OR seller_user_id = 'USER123' 
ORDER BY executed_at DESC;

-- User's current positions
SELECT * FROM positions WHERE user_id = 'USER123' ORDER BY updated_at DESC;

-- ============================================
-- 7. TRADING VOLUME BY SYMBOL (Last 24 hours)
-- ============================================
SELECT 
    symbol,
    COUNT(*) as trade_count,
    SUM(quantity) as total_quantity,
    SUM(price * quantity) as total_value,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM trades
WHERE executed_at > dateadd('d', -1, now())
GROUP BY symbol
ORDER BY total_value DESC;

-- ============================================
-- 8. RECENT USERS
-- ============================================
SELECT 
    id,
    email,
    name,
    balance,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 9. USER BALANCES
-- ============================================
SELECT 
    id,
    name,
    email,
    balance
FROM users
ORDER BY balance DESC;

-- ============================================
-- 10. POSITIONS SUMMARY
-- ============================================
SELECT 
    user_id,
    symbol,
    quantity,
    average_price,
    current_price,
    unrealized_pnl,
    realized_pnl,
    (quantity * average_price) as invested_amount,
    updated_at
FROM positions
ORDER BY updated_at DESC
LIMIT 50;

-- ============================================
-- 11. DAILY TRADING SUMMARY
-- ============================================
SELECT 
    to_str(executed_at, 'yyyy-MM-dd') as trade_date,
    COUNT(*) as total_trades,
    SUM(quantity) as total_quantity,
    SUM(price * quantity) as total_value,
    COUNT(DISTINCT symbol) as unique_symbols,
    COUNT(DISTINCT buyer_user_id) as unique_buyers,
    COUNT(DISTINCT seller_user_id) as unique_sellers
FROM trades
WHERE executed_at > dateadd('d', -7, now())
GROUP BY trade_date
ORDER BY trade_date DESC;

-- ============================================
-- 12. ORDERS WITH MATCHING INFO
-- ============================================
-- Shows which orders have been matched/filled
SELECT 
    o.id as order_id,
    o.user_id,
    o.symbol,
    o.side,
    o.quantity,
    o.price,
    o.status,
    o.filled_quantity,
    o.average_price,
    t.id as trade_id,
    t.executed_at
FROM orders o
LEFT JOIN trades t ON (
    (o.side = 'BUY' AND t.buy_order_id = o.id) OR
    (o.side = 'SELL' AND t.sell_order_id = o.id)
)
ORDER BY o.created_at DESC
LIMIT 100;

-- ============================================
-- 13. TOP TRADERS BY VOLUME
-- ============================================
SELECT 
    user_id,
    COUNT(*) as order_count,
    SUM(CASE WHEN status = 'FILLED' THEN 1 ELSE 0 END) as filled_orders,
    SUM(CASE WHEN side = 'BUY' THEN filled_quantity ELSE 0 END) as total_bought,
    SUM(CASE WHEN side = 'SELL' THEN filled_quantity ELSE 0 END) as total_sold
FROM orders
GROUP BY user_id
ORDER BY filled_orders DESC
LIMIT 20;

-- ============================================
-- 14. SURVEILLANCE ALERTS
-- ============================================
SELECT 
    id,
    type,
    severity,
    symbol,
    description,
    status,
    detected_at,
    resolved_at
FROM surveillance_alerts
ORDER BY detected_at DESC
LIMIT 50;

-- ============================================
-- 15. MARKET DATA (if available)
-- ============================================
SELECT 
    symbol,
    price,
    volume,
    high,
    low,
    timestamp
FROM market_data
ORDER BY timestamp DESC
LIMIT 100;

-- ============================================
-- 16. LIVE MONITORING QUERIES
-- ============================================

-- Real-time order flow (refresh this)
SELECT 
    symbol,
    side,
    COUNT(*) as order_count,
    SUM(quantity) as total_quantity,
    AVG(price) as avg_price
FROM orders
WHERE created_at > dateadd('m', -5, now())
GROUP BY symbol, side
ORDER BY symbol, side;

-- Recent filled orders (last 10 minutes)
SELECT * FROM orders 
WHERE status = 'FILLED' 
AND filled_at > dateadd('m', -10, now())
ORDER BY filled_at DESC;

-- Recent trades (last 10 minutes)
SELECT * FROM trades 
WHERE executed_at > dateadd('m', -10, now())
ORDER BY executed_at DESC;

-- ============================================
-- 17. EXPORT DATA FOR ANALYSIS
-- ============================================

-- Export all trades for a specific day
SELECT * FROM trades 
WHERE executed_at >= '2026-02-14T00:00:00.000Z' 
AND executed_at < '2026-02-15T00:00:00.000Z'
ORDER BY executed_at;

-- Export order book snapshot
SELECT 
    symbol,
    side,
    price,
    SUM(quantity - filled_quantity) as remaining_quantity,
    COUNT(*) as order_count
FROM orders
WHERE status = 'OPEN'
GROUP BY symbol, side, price
ORDER BY symbol, side, price DESC;

-- ============================================
-- 18. COUNT ALL RECORDS
-- ============================================
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
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

-- ============================================
-- 19. MOST ACTIVE SYMBOLS (Last 24 hours)
-- ============================================
SELECT 
    symbol,
    COUNT(DISTINCT CASE WHEN side = 'BUY' THEN user_id END) as unique_buyers,
    COUNT(DISTINCT CASE WHEN side = 'SELL' THEN user_id END) as unique_sellers,
    SUM(CASE WHEN side = 'BUY' THEN filled_quantity ELSE 0 END) as buy_volume,
    SUM(CASE WHEN side = 'SELL' THEN filled_quantity ELSE 0 END) as sell_volume
FROM orders
WHERE created_at > dateadd('d', -1, now())
GROUP BY symbol
ORDER BY (buy_volume + sell_volume) DESC;

-- ============================================
-- 20. ORDER BOOK DEPTH BY SYMBOL
-- ============================================
-- Current order book for RELIANCE
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
