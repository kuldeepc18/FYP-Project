import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('test-data');

async function insertTestData() {
  try {
    logger.info('Starting test data insertion...');

    // Get a test user (first user in the database)
    const userResult = await query(`SELECT id FROM users LATEST ON created_at PARTITION BY id LIMIT 1`);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      logger.error('No users found. Please register a user first.');
      return;
    }

    const userId = userResult.rows[0].id;
    logger.info(`Using user ID: ${userId}`);

    const symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK'];
    const sides = ['BUY', 'SELL'];
    const types = ['MARKET', 'LIMIT'];
    const statuses = ['FILLED', 'OPEN', 'CANCELLED'];

    // Insert 20 test orders
    logger.info('Inserting test orders...');
    for (let i = 0; i < 20; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = sides[Math.floor(Math.random() * sides.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const quantity = Math.floor(Math.random() * 100) + 1;
      const price = 1000 + Math.random() * 2000;
      const filledQty = status === 'FILLED' ? quantity : Math.floor(Math.random() * quantity);
      
      const orderId = `ORD${Date.now()}${i}`;
      const createdAt = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(); // Last 7 days
      
      await query(`
        INSERT INTO orders (
          id, user_id, instrument_id, symbol, side, type, quantity, price,
          stop_price, target_price, stop_loss, status, validity,
          filled_quantity, average_price, fees, created_at
        ) VALUES (
          '${orderId}', '${userId}', ${i % 5 + 1}, '${symbol}', '${side}', 
          '${type}', ${quantity}, ${price}, 0, 0, 0, '${status}', 'GTC',
          ${filledQty}, ${price * 0.99}, ${price * quantity * 0.0003}, '${createdAt}'
        )
      `);
    }
    logger.info('✅ Inserted 20 test orders');

    // Insert 15 test trades
    logger.info('Inserting test trades...');
    for (let i = 0; i < 15; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const quantity = Math.floor(Math.random() * 100) + 1;
      const price = 1000 + Math.random() * 2000;
      const executedAt = new Date(Date.now() - Math.random() * 86400000 * 7).toISOString();
      
      await query(`
        INSERT INTO trades (
          id, buy_order_id, sell_order_id, symbol, price, quantity,
          buyer_user_id, seller_user_id, executed_at
        ) VALUES (
          ${i + 1}, 'ORD${Date.now()}${i}BUY', 'ORD${Date.now()}${i}SELL',
          '${symbol}', ${price}, ${quantity}, '${userId}', 'MARKET', '${executedAt}'
        )
      `);
    }
    logger.info('✅ Inserted 15 test trades');

    // Insert 5 test positions
    logger.info('Inserting test positions...');
    for (let i = 0; i < 5; i++) {
      const symbol = symbols[i];
      const quantity = Math.floor(Math.random() * 1000) + 100;
      const avgPrice = 1000 + Math.random() * 2000;
      const currentPrice = avgPrice * (0.95 + Math.random() * 0.1);
      const unrealizedPnl = (currentPrice - avgPrice) * quantity;
      const realizedPnl = Math.random() * 10000 - 5000;
      
      await query(`
        INSERT INTO positions (
          user_id, symbol, quantity, average_price, current_price,
          unrealized_pnl, realized_pnl, updated_at
        ) VALUES (
          '${userId}', '${symbol}', ${quantity}, ${avgPrice}, ${currentPrice},
          ${unrealizedPnl}, ${realizedPnl}, now()
        )
      `);
    }
    logger.info('✅ Inserted 5 test positions');

    // Verify data
    const orderCount = await query(`SELECT COUNT(*) as count FROM orders`);
    const tradeCount = await query(`SELECT COUNT(*) as count FROM trades`);
    const positionCount = await query(`SELECT COUNT(*) as count FROM positions`);

    logger.info('\n📊 DATABASE STATUS:');
    logger.info(`   Orders: ${orderCount.rows[0].count}`);
    logger.info(`   Trades: ${tradeCount.rows[0].count}`);
    logger.info(`   Positions: ${positionCount.rows[0].count}`);
    logger.info('\n✅ Test data insertion completed successfully!');

  } catch (error) {
    logger.error('Error inserting test data:', error);
    throw error;
  }
}

// Run the script
insertTestData()
  .then(() => process.exit(0))
  .catch(err => {
    logger.error('Fatal error:', err);
    process.exit(1);
  });
