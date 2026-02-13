import { adminApiClient, ADMIN_API_ENDPOINTS } from '@/config/api';

export interface MarketInstrument {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h?: number;
  low24h?: number;
  timestamp: string;
}

export interface OrderBookEntry {
  id: string;
  symbol: string;
  side: "BID" | "ASK";
  price: number;
  quantity: number;
  total: number;
  timestamp: string;
  source: "MARKET" | "MODEL";
}

export interface TradeRecord {
  id: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: number;
  quantity: number;
  total: number;
  maker?: string;
  taker?: string;
  timestamp: string;
  source?: "MARKET" | "MODEL";
}

export interface SurveillanceAlert {
  id: string;
  type: "ANOMALY" | "MANIPULATION" | "SUSPICIOUS";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  symbol?: string;
  description: string;
  detectedAt: string;
  status: "ACTIVE" | "INVESTIGATING" | "RESOLVED";
}

// Fetch market data from backend API
export async function getMarketInstruments(): Promise<MarketInstrument[]> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.MARKET.SYMBOLS);
    return response.data.map((inst: any) => ({
      symbol: inst.symbol,
      name: inst.name,
      lastPrice: inst.marketPrice || 0,
      change: inst.change || 0,
      changePercent: inst.changePercent || 0,
      volume: Math.floor(Math.random() * 10000000), // Backend doesn't provide volume yet
      high24h: inst.marketPrice * 1.02,
      low24h: inst.marketPrice * 0.98,
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch market instruments:', error);
    return [];
  }
}

// Fetch order book from backend API
export async function getOrderBook(symbol?: string): Promise<OrderBookEntry[]> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.ORDERS.BOOK);
    return response.data.map((order: any, index: number) => ({
      id: order.id || `order-${index}`,
      symbol: order.symbol,
      side: order.side === 'BUY' ? 'BID' : 'ASK',
      price: order.price,
      quantity: order.quantity,
      total: order.price * order.quantity,
      timestamp: new Date(order.timestamp).toISOString(),
      source: 'MARKET',
    }));
  } catch (error) {
    console.error('Failed to fetch order book:', error);
    return [];
  }
}

// Fetch trade history from backend API
export async function getTradeHistory(): Promise<TradeRecord[]> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.TRADES.HISTORY);
    return response.data.map((trade: any) => ({
      id: trade.id,
      symbol: trade.symbol,
      side: trade.side,
      price: trade.price,
      quantity: trade.quantity,
      total: trade.price * trade.quantity,
      maker: trade.userId || 'User',
      taker: 'Market',
      timestamp: new Date(trade.timestamp).toISOString(),
      source: 'MARKET',
    }));
  } catch (error) {
    console.error('Failed to fetch trade history:', error);
    return [];
  }
}

// Fetch surveillance alerts from backend API
export async function getSurveillanceAlerts(): Promise<SurveillanceAlert[]> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.SURVEILLANCE.ALERTS);
    return response.data.map((alert: any) => ({
      id: alert.id,
      type: alert.type || 'ANOMALY',
      severity: alert.severity,
      symbol: alert.symbol,
      description: alert.message || alert.description,
      detectedAt: new Date(alert.timestamp).toISOString(),
      status: 'ACTIVE',
    }));
  } catch (error) {
    console.error('Failed to fetch surveillance alerts:', error);
    return [];
  }
}

// Get ML model status
export async function getMLModelStatus(): Promise<any> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.ML.METRICS);
    return {
      status: 'ACTIVE',
      accuracy: response.data.accuracy || 0,
      precision: response.data.precision || 0,
      recall: response.data.recall || 0,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch ML model status:', error);
    return {
      status: 'INACTIVE',
      accuracy: 0,
      precision: 0,
      recall: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Get market overview data
export async function getMarketOverview(): Promise<any> {
  try {
    const response = await adminApiClient.get(ADMIN_API_ENDPOINTS.MARKET.DATA);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch market overview:', error);
    return {
      totalVolume: 0,
      totalTrades: 0,
      activeOrders: 0,
    };
  }
}
