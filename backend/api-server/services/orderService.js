import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { getQuote, INSTRUMENTS } from './marketService.js';

const logger = createLogger('order-service');

// In-memory order book (simple implementation)
const orderBook = {};
let tradeIdCounter = 1;

// Initialize order book for all instruments
export function initializeOrderBook() {
  INSTRUMENTS.forEach(instrument => {
    orderBook[instrument.symbol] = {
      bids: [], // Buy orders sorted by price desc
      asks: []  // Sell orders sorted by price asc
    };
  });
  logger.info('Order book initialized');
}

// Place a new order
export async function placeOrder(userId, orderData) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Validate instrument
    const instrument = INSTRUMENTS.find(i => i.symbol === orderData.symbol);
    if (!instrument) {
      throw new Error('Invalid instrument');
    }
    
    // Get user balance
    const userResult = await client.query(
      `SELECT * FROM users WHERE id = '${userId}' LATEST ON created_at PARTITION BY id`
    );
    
    if (!userResult.rows || userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Calculate required balance for buy orders
    if (orderData.side === 'BUY') {
      const quote = getQuote(orderData.symbol);
      const orderPrice = orderData.type === 'MARKET' ? quote.ask : orderData.price;
      const requiredAmount = orderPrice * orderData.quantity;
      const fees = requiredAmount * 0.0003; // 0.03% fees
      const totalRequired = requiredAmount + fees;
      
      if (user.balance < totalRequired) {
        throw new Error('Insufficient balance');
      }
    }
    
    // Create order
    const orderId = `ORD${uuidv4().substring(0, 12)}`;
    const now = new Date().toISOString();
    
    const order = {
      id: orderId,
      userId,
      instrumentId: instrument.id,
      symbol: orderData.symbol,
      side: orderData.side,
      type: orderData.type,
      quantity: orderData.quantity,
      price: orderData.price || 0,
      stopPrice: orderData.stopPrice || 0,
      targetPrice: orderData.targetPrice || 0,
      stopLoss: orderData.stopLoss || 0,
      status: 'OPEN',
      validity: orderData.validity || 'GTC',
      filledQuantity: 0,
      averagePrice: 0,
      fees: 0,
      createdAt: now
    };
    
    // Insert into database
    await client.query(
      `INSERT INTO orders (
        id, user_id, instrument_id, symbol, side, type, quantity, price, 
        stop_price, target_price, stop_loss, status, validity, 
        filled_quantity, average_price, fees, created_at
      ) VALUES (
        '${order.id}', '${order.userId}', ${order.instrumentId}, '${order.symbol}',
        '${order.side}', '${order.type}', ${order.quantity}, ${order.price},
        ${order.stopPrice}, ${order.targetPrice}, ${order.stopLoss},
        '${order.status}', '${order.validity}', ${order.filledQuantity},
        ${order.averagePrice}, ${order.fees}, '${order.createdAt}'
      )`
    );
    
    // Try to match order
    if (orderData.type === 'MARKET' || orderData.type === 'LIMIT') {
      await matchOrder(client, order);
    }
    
    await client.query('COMMIT');
    
    logger.info(`Order placed: ${orderId} - ${orderData.side} ${orderData.quantity} ${orderData.symbol} @ ${orderData.price || 'MARKET'}`);
    
    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Place order error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Simple matching engine
async function matchOrder(client, order) {
  try {
    const quote = getQuote(order.symbol);
    if (!quote) return;
    
    let matchPrice = 0;
    
    if (order.type === 'MARKET') {
      matchPrice = order.side === 'BUY' ? quote.ask : quote.bid;
    } else if (order.type === 'LIMIT') {
      matchPrice = order.price;
    }
    
    // For simplicity, instantly fill market orders at current price
    if (order.type === 'MARKET') {
      const fillQty = order.quantity;
      const fillPrice = matchPrice;
      const fees = fillQty * fillPrice * 0.0003;
      
      // Update order status
      await client.query(
        `INSERT INTO orders (
          id, user_id, instrument_id, symbol, side, type, quantity, price,
          stop_price, target_price, stop_loss, status, validity,
          filled_quantity, average_price, fees, created_at, filled_at
        ) VALUES (
          '${order.id}', '${order.userId}', ${order.instrumentId}, '${order.symbol}',
          '${order.side}', '${order.type}', ${order.quantity}, ${matchPrice},
          ${order.stopPrice}, ${order.targetPrice}, ${order.stopLoss},
          'FILLED', '${order.validity}', ${fillQty}, ${fillPrice}, ${fees},
          '${order.createdAt}', '${new Date().toISOString()}'
        )`
      );
      
      // Create trade record
      const tradeId = tradeIdCounter++;
      const now = new Date().toISOString();
      await client.query(
        `INSERT INTO trades (
          id, buy_order_id, sell_order_id, symbol, price, quantity,
          buyer_user_id, seller_user_id, executed_at
        ) VALUES (
          ${tradeId},
          '${order.side === 'BUY' ? order.id : 'MKT'}',
          '${order.side === 'SELL' ? order.id : 'MKT'}',
          '${order.symbol}', ${fillPrice}, ${fillQty},
          '${order.side === 'BUY' ? order.userId : 'MARKET'}',
          '${order.side === 'SELL' ? order.userId : 'MARKET'}',
          '${now}'
        )`
      );
      
      // Update user balance
      if (order.side === 'BUY') {
        const totalCost = fillQty * fillPrice + fees;
        await client.query(
          `INSERT INTO users 
           SELECT id, email, password_hash, name, balance - ${totalCost}, created_at, '${now}' as updated_at
           FROM users
           WHERE id = '${order.userId}'
           LATEST ON created_at PARTITION BY id`
        );
      } else {
        const totalProceeds = fillQty * fillPrice - fees;
        await client.query(
          `INSERT INTO users
           SELECT id, email, password_hash, name, balance + ${totalProceeds}, created_at, '${now}' as updated_at
           FROM users
           WHERE id = '${order.userId}'
           LATEST ON created_at PARTITION BY id`
        );
      }
      
      // Update or create position
      await updatePosition(client, order.userId, order.symbol, order.side, fillQty, fillPrice);
      
      order.status = 'FILLED';
      order.filledQuantity = fillQty;
      order.averagePrice = fillPrice;
      order.fees = fees;
      
      logger.info(`Order filled: ${order.id} - ${fillQty} @ ${fillPrice}`);
    }
  } catch (error) {
    logger.error('Match order error:', error);
    throw error;
  }
}

// Update user position
async function updatePosition(client, userId, symbol, side, quantity, price) {
  try {
    const now = new Date().toISOString();
    const quote = getQuote(symbol);
    
    // Get existing position
    const posResult = await client.query(
      `SELECT * FROM positions 
       WHERE user_id = '${userId}' AND symbol = '${symbol}'
       LATEST ON updated_at PARTITION BY id`
    );
    
    let newQty = side === 'BUY' ? quantity : -quantity;
    let avgPrice = price;
    let realizedPnl = 0;
    
    if (posResult.rows && posResult.rows.length > 0) {
      const pos = posResult.rows[0];
      const existingQty = pos.quantity;
      const existingAvg = pos.average_price;
      
      if ((existingQty > 0 && side === 'BUY') || (existingQty < 0 && side === 'SELL')) {
        // Adding to position
        const totalQty = Math.abs(existingQty) + quantity;
        avgPrice = (Math.abs(existingQty) * existingAvg + quantity * price) / totalQty;
        newQty = existingQty + (side === 'BUY' ? quantity : -quantity);
      } else {
        // Reducing or reversing position
        const closeQty = Math.min(Math.abs(existingQty), quantity);
        realizedPnl = closeQty * (price - existingAvg) * (existingQty > 0 ? 1 : -1);
        newQty = existingQty + (side === 'BUY' ? quantity : -quantity);
        avgPrice = newQty === 0 ? 0 : existingAvg;
      }
      realizedPnl += pos.realized_pnl;
    }
    
    const unrealizedPnl = newQty * (quote.price - avgPrice);
    
    // Insert new position record
    const posId = Date.now();
    await client.query(
      `INSERT INTO positions (
        id, user_id, symbol, quantity, average_price, current_price,
        unrealized_pnl, realized_pnl, updated_at
      ) VALUES (
        ${posId}, '${userId}', '${symbol}', ${newQty}, ${avgPrice}, ${quote.price},
        ${unrealizedPnl}, ${realizedPnl}, '${now}'
      )`
    );
    
    logger.info(`Position updated: ${userId} ${symbol} ${newQty} @ ${avgPrice}`);
  } catch (error) {
    logger.error('Update position error:', error);
    throw error;
  }
}

// Get user orders
export async function getUserOrders(userId, status = null) {
  try {
    let queryStr = `
      SELECT * FROM orders 
      WHERE user_id = '${userId}'
    `;
    
    if (status) {
      queryStr += ` AND status = '${status}'`;
    }
    
    queryStr += ` LATEST ON created_at PARTITION BY id ORDER BY created_at DESC`;
    
    const result = await query(queryStr);
    return result.rows || [];
  } catch (error) {
    logger.error('Get user orders error:', error);
    throw error;
  }
}

// Cancel order
export async function cancelOrder(userId, orderId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get order
    const orderResult = await client.query(
      `SELECT * FROM orders WHERE id = '${orderId}' LATEST ON created_at PARTITION BY id`
    );
    
    if (!orderResult.rows || orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }
    
    const order = orderResult.rows[0];
    
    if (order.user_id !== userId) {
      throw new Error('Unauthorized');
    }
    
    if (order.status !== 'OPEN' && order.status !== 'PENDING') {
      throw new Error('Order cannot be cancelled');
    }
    
    // Update order status
    const now = new Date().toISOString();
    await client.query(
      `INSERT INTO orders 
       SELECT id, user_id, instrument_id, symbol, side, type, quantity, price,
              stop_price, target_price, stop_loss, 'CANCELLED' as status, validity,
              filled_quantity, average_price, fees, created_at, filled_at, '${now}' as cancelled_at
       FROM orders
       WHERE id = '${orderId}'
       LATEST ON created_at PARTITION BY id`
    );
    
    await client.query('COMMIT');
    
    logger.info(`Order cancelled: ${orderId}`);
    
    return { success: true, message: 'Order cancelled successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Cancel order error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get user positions
export async function getUserPositions(userId) {
  try {
    const result = await query(
      `SELECT * FROM positions 
       WHERE user_id = '${userId}' AND quantity != 0
       LATEST ON updated_at PARTITION BY symbol
       ORDER BY symbol`
    );
    
    // Update current prices and unrealized P&L
    const positions = (result.rows || []).map(pos => {
      const quote = getQuote(pos.symbol);
      const currentPrice = quote ? quote.price : pos.current_price;
      const unrealizedPnl = pos.quantity * (currentPrice - pos.average_price);
      
      return {
        ...pos,
        current_price: currentPrice,
        unrealized_pnl: parseFloat(unrealizedPnl.toFixed(2)),
        totalValue: parseFloat((pos.quantity * currentPrice).toFixed(2))
      };
    });
    
    return positions;
  } catch (error) {
    logger.error('Get user positions error:', error);
    throw error;
  }
}

// Get user holdings (aggregate positions)
export async function getUserHoldings(userId) {
  try {
    const positions = await getUserPositions(userId);
    
    return positions.map(pos => {
      const instrument = INSTRUMENTS.find(i => i.symbol === pos.symbol);
      return {
        symbol: pos.symbol,
        name: instrument ? instrument.name : pos.symbol,
        quantity: Math.abs(pos.quantity),
        averagePrice: pos.average_price,
        currentPrice: pos.current_price,
        pnl: pos.realized_pnl + pos.unrealized_pnl,
        pnlPercent: parseFloat(((pos.unrealized_pnl / (pos.average_price * Math.abs(pos.quantity))) * 100).toFixed(2)),
        value: pos.totalValue
      };
    });
  } catch (error) {
    logger.error('Get user holdings error:', error);
    throw error;
  }
}

// Get all orders (admin)
export async function getAllOrders(limit = 100) {
  try {
    const result = await query(
      `SELECT * FROM orders 
       ORDER BY created_at DESC 
       LIMIT ${limit}`
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Get all orders error:', error);
    throw error;
  }
}

// Get all trades (admin)
export async function getAllTrades(limit = 100) {
  try {
    const result = await query(
      `SELECT * FROM trades 
       ORDER BY executed_at DESC 
       LIMIT ${limit}`
    );
    return result.rows || [];
  } catch (error) {
    logger.error('Get all trades error:', error);
    throw error;
  }
}

// Get trade statistics
export async function getTradeStatistics() {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_trades,
        SUM(quantity) as total_volume,
        SUM(price * quantity) as total_value
       FROM trades
       WHERE executed_at > dateadd('d', -1, now())`
    );
    
    const stats = result.rows && result.rows.length > 0 ? result.rows[0] : {
      total_trades: 0,
      total_volume: 0,
      total_value: 0
    };
    
    return {
      totalTrades: parseInt(stats.total_trades) || 0,
      totalVolume: parseInt(stats.total_volume) || 0,
      totalValue: parseFloat(stats.total_value) || 0,
      period: '24h'
    };
  } catch (error) {
    logger.error('Get trade statistics error:', error);
    return {
      totalTrades: 0,
      totalVolume: 0,
      totalValue: 0,
      period: '24h'
    };
  }
}
