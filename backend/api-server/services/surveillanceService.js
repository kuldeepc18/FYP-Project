import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { getAllQuotes } from './marketService.js';
import { getAllTrades, getAllOrders } from './orderService.js';

const logger = createLogger('surveillance-service');

let alertIdCounter = 1;

// Alert severity levels
const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

// Alert types
const ALERT_TYPE = {
  PRICE_ANOMALY: 'PRICE_ANOMALY',
  VOLUME_SPIKE: 'VOLUME_SPIKE',
  WASH_TRADING: 'WASH_TRADING',
  LAYERING: 'LAYERING',
  SPOOFING: 'SPOOFING',
  PUMP_AND_DUMP: 'PUMP_AND_DUMP',
  FRONT_RUNNING: 'FRONT_RUNNING',
  ORDER_CANCELLATION: 'ORDER_CANCELLATION'
};

// In-memory alerts cache
let activeAlerts = [];

// Detect price anomalies
function detectPriceAnomalies() {
  const alerts = [];
  const quotes = getAllQuotes();
  
  quotes.forEach(quote => {
    // Check for unusual price movements
    if (Math.abs(quote.changePercent) > 5) {
      alerts.push({
        type: ALERT_TYPE.PRICE_ANOMALY,
        severity: Math.abs(quote.changePercent) > 10 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
        symbol: quote.symbol,
        description: `Unusual price movement: ${quote.changePercent.toFixed(2)}% change`,
        data: {
          currentPrice: quote.price,
          previousClose: quote.previousClose,
          change: quote.change,
          changePercent: quote.changePercent
        }
      });
    }
    
    // Check for volume spikes
    const avgVolume = 5000000; // Mock average volume
    if (quote.volume > avgVolume * 3) {
      alerts.push({
        type: ALERT_TYPE.VOLUME_SPIKE,
        severity: SEVERITY.MEDIUM,
        symbol: quote.symbol,
        description: `Volume spike detected: ${((quote.volume / avgVolume) * 100).toFixed(0)}% of average`,
        data: {
          currentVolume: quote.volume,
          averageVolume: avgVolume,
          ratio: (quote.volume / avgVolume).toFixed(2)
        }
      });
    }
  });
  
  return alerts;
}

// Detect wash trading patterns
async function detectWashTrading() {
  const alerts = [];
  
  try {
    // Get recent trades
    const trades = await getAllTrades(1000);
    
    // Group trades by user pairs
    const tradePairs = {};
    
    trades.forEach(trade => {
      if (trade.buyer_user_id === 'MARKET' || trade.seller_user_id === 'MARKET') return;
      
      const pair = [trade.buyer_user_id, trade.seller_user_id].sort().join('-');
      if (!tradePairs[pair]) {
        tradePairs[pair] = [];
      }
      tradePairs[pair].push(trade);
    });
    
    // Check for suspicious patterns
    Object.entries(tradePairs).forEach(([pair, pairTrades]) => {
      if (pairTrades.length > 10) { // More than 10 trades between same users
        const [user1, user2] = pair.split('-');
        alerts.push({
          type: ALERT_TYPE.WASH_TRADING,
          severity: SEVERITY.HIGH,
          symbol: pairTrades[0].symbol,
          description: `Potential wash trading: ${pairTrades.length} trades between same users`,
          data: {
            user1,
            user2,
            tradeCount: pairTrades.length,
            totalVolume: pairTrades.reduce((sum, t) => sum + t.quantity, 0)
          }
        });
      }
    });
  } catch (error) {
    logger.error('Error detecting wash trading:', error);
  }
  
  return alerts;
}

// Detect layering and spoofing
async function detectLayering() {
  const alerts = [];
  
  try {
    const orders = await getAllOrders(1000);
    
    // Group orders by user
    const userOrders = {};
    
    orders.forEach(order => {
      if (!userOrders[order.user_id]) {
        userOrders[order.user_id] = [];
      }
      userOrders[order.user_id].push(order);
    });
    
    // Check for layering patterns
    Object.entries(userOrders).forEach(([userId, orders]) => {
      const cancelledOrders = orders.filter(o => o.status === 'CANCELLED');
      const totalOrders = orders.length;
      
      if (totalOrders > 20) {
        const cancellationRate = cancelledOrders.length / totalOrders;
        
        if (cancellationRate > 0.8) { // More than 80% cancelled
          alerts.push({
            type: ALERT_TYPE.LAYERING,
            severity: SEVERITY.HIGH,
            symbol: orders[0].symbol,
            description: `Potential layering: ${(cancellationRate * 100).toFixed(0)}% order cancellation rate`,
            data: {
              userId,
              totalOrders,
              cancelledOrders: cancelledOrders.length,
              cancellationRate: cancellationRate.toFixed(2)
            }
          });
        }
      }
    });
  } catch (error) {
    logger.error('Error detecting layering:', error);
  }
  
  return alerts;
}

// Detect pump and dump schemes
function detectPumpAndDump() {
  const alerts = [];
  const quotes = getAllQuotes();
  
  quotes.forEach(quote => {
    // Check for rapid price increase followed by high volume
    if (quote.changePercent > 15 && quote.volume > 10000000) {
      alerts.push({
        type: ALERT_TYPE.PUMP_AND_DUMP,
        severity: SEVERITY.CRITICAL,
        symbol: quote.symbol,
        description: `Potential pump & dump: ${quote.changePercent.toFixed(2)}% price surge with high volume`,
        data: {
          priceChange: quote.changePercent,
          volume: quote.volume,
          currentPrice: quote.price
        }
      });
    }
  });
  
  return alerts;
}

// Run all surveillance checks
export async function runSurveillanceChecks() {
  try {
    const allAlerts = [
      ...detectPriceAnomalies(),
      ...await detectWashTrading(),
      ...await detectLayering(),
      ...detectPumpAndDump()
    ];
    
    // Store alerts in database
    for (const alert of allAlerts) {
      const alertId = alertIdCounter++;
      const now = new Date().toISOString();
      
      try {
        await query(
          `INSERT INTO surveillance_alerts (
            id, type, severity, symbol, description, detected_at, status
          ) VALUES (
            ${alertId}, '${alert.type}', '${alert.severity}', 
            ${alert.symbol ? `'${alert.symbol}'` : 'null'}, 
            '${alert.description}', '${now}', 'ACTIVE'
          )`
        );
        
        alert.id = alertId;
        alert.detectedAt = now;
        alert.status = 'ACTIVE';
        
        activeAlerts.unshift(alert);
      } catch (error) {
        logger.error('Error storing alert:', error);
      }
    }
    
    // Keep only last 100 alerts in memory
    activeAlerts = activeAlerts.slice(0, 100);
    
    logger.info(`Surveillance check completed: ${allAlerts.length} alerts generated`);
    return allAlerts;
  } catch (error) {
    logger.error('Surveillance check error:', error);
    return [];
  }
}

// Get all alerts
export async function getAllAlerts(limit = 50, status = null) {
  try {
    let queryStr = 'SELECT * FROM surveillance_alerts';
    
    if (status) {
      queryStr += ` WHERE status = '${status}'`;
    }
    
    queryStr += ` ORDER BY detected_at DESC LIMIT ${limit}`;
    
    const result = await query(queryStr);
    return result.rows || [];
  } catch (error) {
    logger.error('Get alerts error:', error);
    return activeAlerts.slice(0, limit);
  }
}

// Get alert by ID
export async function getAlertById(id) {
  try {
    const result = await query(
      `SELECT * FROM surveillance_alerts WHERE id = ${id} LIMIT 1`
    );
    return result.rows && result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Get alert by ID error:', error);
    return null;
  }
}

// Update alert status
export async function updateAlertStatus(id, status) {
  try {
    const now = new Date().toISOString();
    const resolvedAt = status === 'RESOLVED' ? now : null;
    
    await query(
      `INSERT INTO surveillance_alerts
       SELECT id, type, severity, symbol, description, detected_at, 
              '${status}' as status, ${resolvedAt ? `'${resolvedAt}'` : 'null'} as resolved_at
       FROM surveillance_alerts
       WHERE id = ${id}
       LATEST ON detected_at`
    );
    
    logger.info(`Alert ${id} status updated to ${status}`);
    return { success: true };
  } catch (error) {
    logger.error('Update alert status error:', error);
    throw error;
  }
}

// Get suspicious patterns
export function getSuspiciousPatterns() {
  return {
    washTrading: {
      detected: Math.floor(Math.random() * 5),
      description: 'Trades between same users to inflate volume'
    },
    layering: {
      detected: Math.floor(Math.random() * 3),
      description: 'Multiple orders placed then cancelled'
    },
    spoofing: {
      detected: Math.floor(Math.random() * 4),
      description: 'Large orders placed to manipulate price'
    },
    frontRunning: {
      detected: Math.floor(Math.random() * 2),
      description: 'Trading ahead of known pending orders'
    }
  };
}

// Start periodic surveillance checks
export function startSurveillanceMonitoring() {
  // Run checks every 30 seconds
  setInterval(async () => {
    await runSurveillanceChecks();
  }, 30000);
  
  // Run initial check
  runSurveillanceChecks();
  
  logger.info('Surveillance monitoring started');
}
