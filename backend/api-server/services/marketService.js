import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('market-service');

// Indian market instruments - matching the C++ engine
export const INSTRUMENTS = [
  { id: 1, symbol: 'RELIANCE', name: 'Reliance Industries Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1550.00 },
  { id: 2, symbol: 'TCS', name: 'Tata Consultancy Services', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 3200.00 },
  { id: 3, symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1650.00 },
  { id: 4, symbol: 'INFY', name: 'Infosys Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1450.00 },
  { id: 5, symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 950.00 },
  { id: 6, symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 2550.00 },
  { id: 7, symbol: 'ITC', name: 'ITC Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 450.00 },
  { id: 8, symbol: 'SBIN', name: 'State Bank of India', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 575.00 },
  { id: 9, symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1150.00 },
  { id: 10, symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1750.00 },
  { id: 11, symbol: 'LT', name: 'Larsen & Toubro Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 3350.00 },
  { id: 12, symbol: 'AXISBANK', name: 'Axis Bank Ltd', type: 'STOCK', exchange: 'NSE', lot: 1, basePrice: 1050.00 },
  { id: 13, symbol: 'NIFTY50', name: 'NIFTY 50 Index', type: 'INDEX', exchange: 'NSE', lot: 50, basePrice: 21500.00 },
  { id: 14, symbol: 'BANKNIFTY', name: 'Bank NIFTY Index', type: 'INDEX', exchange: 'NSE', lot: 25, basePrice: 45000.00 },
  { id: 15, symbol: 'SENSEX', name: 'BSE SENSEX Index', type: 'INDEX', exchange: 'BSE', lot: 10, basePrice: 71000.00 }
];

// In-memory market data store (simulated real-time prices)
let marketData = {};

// Save market data to QuestDB
async function saveMarketDataToDatabase() {
  try {
    const quotes = getAllQuotes();
    
    for (const quote of quotes) {
      await query(
        `INSERT INTO market_data (
          symbol, price, change, change_percent, volume,
          high, low, open, previous_close, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
        [
          quote.symbol,
          quote.price,
          quote.change,
          quote.changePercent,
          quote.volume,
          quote.high,
          quote.low,
          quote.open,
          quote.previousClose
        ]
      );
    }
    
    logger.debug(`Saved ${quotes.length} market data records to database`);
  } catch (error) {
    logger.error('Error saving market data to database:', error.message);
  }
}

// Initialize market data
export async function initializeMarketData() {
  INSTRUMENTS.forEach(instrument => {
    const volatility = Math.random() * 0.02; // 0-2% volatility
    const change = (Math.random() - 0.5) * volatility * 2;
    const price = instrument.basePrice * (1 + change);
    
    marketData[instrument.symbol] = {
      symbol: instrument.symbol,
      name: instrument.name,
      type: instrument.type,
      exchange: instrument.exchange,
      price: parseFloat(price.toFixed(2)),
      open: parseFloat((price * 0.995).toFixed(2)),
      high: parseFloat((price * 1.01).toFixed(2)),
      low: parseFloat((price * 0.99).toFixed(2)),
      previousClose: instrument.basePrice,
      change: parseFloat((price - instrument.basePrice).toFixed(2)),
      changePercent: parseFloat(((price - instrument.basePrice) / instrument.basePrice * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      lastUpdated: new Date().toISOString(),
      bid: parseFloat((price * 0.999).toFixed(2)),
      ask: parseFloat((price * 1.001).toFixed(2)),
      bidSize: Math.floor(Math.random() * 1000) + 100,
      askSize: Math.floor(Math.random() * 1000) + 100
    };
  });
  
  logger.info('Market data initialized for ' + INSTRUMENTS.length + ' instruments');
  
  // Save initial data to database
  await saveMarketDataToDatabase();
}

// Update market data (simulated real-time updates)
export function updateMarketData() {
  Object.keys(marketData).forEach(symbol => {
    const data = marketData[symbol];
    const volatility = 0.001; // 0.1% per update
    const priceChange = (Math.random() - 0.5) * volatility * 2;
    const newPrice = data.price * (1 + priceChange);
    
    marketData[symbol] = {
      ...data,
      price: parseFloat(newPrice.toFixed(2)),
      high: Math.max(data.high, newPrice),
      low: Math.min(data.low, newPrice),
      change: parseFloat((newPrice - data.previousClose).toFixed(2)),
      changePercent: parseFloat(((newPrice - data.previousClose) / data.previousClose * 100).toFixed(2)),
      volume: data.volume + Math.floor(Math.random() * 1000),
      lastUpdated: new Date().toISOString(),
      bid: parseFloat((newPrice * 0.999).toFixed(2)),
      ask: parseFloat((newPrice * 1.001).toFixed(2)),
      bidSize: Math.floor(Math.random() * 1000) + 100,
      askSize: Math.floor(Math.random() * 1000) + 100
    };
  });
}

// Get all market quotes
export function getAllQuotes() {
  return Object.values(marketData);
}

// Get single instrument quote
export function getQuote(symbol) {
  return marketData[symbol] || null;
}

// Search instruments
export function searchInstruments(query) {
  const searchTerm = query.toLowerCase();
  return INSTRUMENTS.filter(instrument => 
    instrument.symbol.toLowerCase().includes(searchTerm) || 
    instrument.name.toLowerCase().includes(searchTerm)
  ).map(instrument => ({
    ...instrument,
    ...marketData[instrument.symbol]
  }));
}

// Get order book depth (mock implementation)
export function getOrderBook(symbol) {
  const quote = marketData[symbol];
  if (!quote) return null;
  
  const generateLevels = (basePrice, isBid) => {
    const levels = [];
    for (let i = 0; i < 5; i++) {
      const price = isBid 
        ? basePrice * (1 - (i + 1) * 0.001) 
        : basePrice * (1 + (i + 1) * 0.001);
      levels.push({
        price: parseFloat(price.toFixed(2)),
        quantity: Math.floor(Math.random() * 1000) + 100,
        orders: Math.floor(Math.random() * 10) + 1
      });
    }
    return levels;
  };
  
  return {
    symbol,
    bids: generateLevels(quote.bid, true),
    asks: generateLevels(quote.ask, false),
    lastUpdated: new Date().toISOString()
  };
}

// Get historical data (mock implementation)
export function getHistoricalData(symbol, interval = '1m', limit = 100) {
  const quote = marketData[symbol];
  if (!quote) return [];
  
  const data = [];
  let currentTime = Date.now();
  let currentPrice = quote.open;
  
  for (let i = limit - 1; i >= 0; i--) {
    const volatility = 0.01;
    const change = (Math.random() - 0.5) * volatility * 2;
    const open = currentPrice;
    const close = currentPrice * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.005);
    const low = Math.min(open, close) * (1 - Math.random() * 0.005);
    const volume = Math.floor(Math.random() * 100000) + 10000;
    
    data.unshift({
      timestamp: currentTime - (i * 60000), // 1 minute intervals
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    currentPrice = close;
  }
  
  return data;
}

// Get market statistics
export function getMarketStatistics() {
  const quotes = getAllQuotes();
  const totalVolume = quotes.reduce((sum, q) => sum + q.volume, 0);
  const advancers = quotes.filter(q => q.change > 0).length;
  const decliners = quotes.filter(q => q.change < 0).length;
  const unchanged = quotes.filter(q => q.change === 0).length;
  
  return {
    totalInstruments: quotes.length,
    totalVolume,
    advancers,
    decliners,
    unchanged,
    topgainers: quotes
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5)
      .map(q => ({ symbol: q.symbol, name: q.name, change: q.changePercent })),
    topLosers: quotes
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5)
      .map(q => ({ symbol: q.symbol, name: q.name, change: q.changePercent })),
    mostActive: quotes
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map(q => ({ symbol: q.symbol, name: q.name, volume: q.volume }))
  };
}

// Get market data from database (for historical queries)
export async function getMarketDataFromDatabase(symbol = null, limit = 100) {
  try {
    let queryText;
    let params;
    
    if (symbol) {
      queryText = `
        SELECT symbol, price, change, change_percent, volume, high, low, open, previous_close, updated_at
        FROM market_data
        WHERE symbol = $1
        ORDER BY updated_at DESC
        LIMIT $2
      `;
      params = [symbol, limit];
    } else {
      // Get latest data for each symbol
      queryText = `
        SELECT symbol, price, change, change_percent, volume, high, low, open, previous_close, updated_at
        FROM (
          SELECT *, ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY updated_at DESC) as rn
          FROM market_data
        ) WHERE rn = 1
        ORDER BY symbol
      `;
      params = [];
    }
    
    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    logger.error('Error fetching market data from database:', error.message);
    return [];
  }
}

// Start market data updates (every 2 seconds)
export function startMarketDataUpdates(io) {
  initializeMarketData();
  
  // Save to database every 10 seconds (not every 2 seconds to avoid overload)
  let updateCounter = 0;
  
  setInterval(() => {
    updateMarketData();
    updateCounter++;
    
    // Save to database every 5 updates (10 seconds)
    if (updateCounter % 5 === 0) {
      saveMarketDataToDatabase().catch(err => {
        logger.error('Failed to save market data to database:', err);
      });
    }
    
    // Broadcast to WebSocket clients
    if (io) {
      const quotes = getAllQuotes();
      quotes.forEach(quote => {
        io.to(`tick:${quote.symbol}`).emit('market_update', {
          type: 'market_update',
          data: quote
        });
      });
    }
  }, 2000); // Update every 2 seconds
  
  logger.info('Market data updates started (saving to database every 10 seconds)');
}
