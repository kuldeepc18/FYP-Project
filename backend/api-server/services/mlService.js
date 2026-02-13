import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';
import { getAllQuotes, INSTRUMENTS } from './marketService.js';

const logger = createLogger('ml-service');

// Mock ML model status and predictions
let mlModelStatus = {
  status: 'ACTIVE',
  accuracy: 0.78,
  precision: 0.82,
  recall: 0.75,
  f1Score: 0.785,
  lastTrained: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  lastUpdated: new Date().toISOString(),
  totalPredictions: 15420,
  correctPredictions: 12028
};

// Generate ML predictions for instruments
export function generateMLPredictions() {
  const quotes = getAllQuotes();
  const predictions = [];
  
  quotes.forEach(quote => {
    const currentPrice = quote.price;
    const volatility = Math.abs(quote.changePercent) / 100;
    
    // Simple prediction: trend continuation with some randomness
    const trendFactor = quote.change > 0 ? 1 : -1;
    const randomFactor = (Math.random() - 0.5) * 0.01; // ±0.5%
    const predictedChange = (volatility * trendFactor + randomFactor) * currentPrice;
    const predictedPrice = currentPrice + predictedChange;
    
    // Confidence based on volatility (lower volatility = higher confidence)
    const confidence = Math.max(0.6, Math.min(0.95, 1 - (volatility * 10)));
    
    // Prediction direction
    let direction = 'NEUTRAL';
    if (predictedChange > currentPrice * 0.005) direction = 'BULLISH';
    else if (predictedChange < -currentPrice * 0.005) direction = 'BEARISH';
    
    predictions.push({
      symbol: quote.symbol,
      name: quote.name,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      predictedPrice: parseFloat(predictedPrice.toFixed(2)),
      predictedChange: parseFloat(predictedChange.toFixed(2)),
      predictedChangePercent: parseFloat(((predictedChange / currentPrice) * 100).toFixed(2)),
      confidence: parseFloat(confidence.toFixed(2)),
      direction,
      timeHorizon: '5min',
      timestamp: new Date().toISOString()
    });
  });
  
  return predictions.sort((a, b) => Math.abs(b.predictedChangePercent) - Math.abs(a.predictedChangePercent));
}

// Get ML model metrics
export function getMLMetrics() {
  return {
    ...mlModelStatus,
    performanceHistory: generatePerformanceHistory(),
    confusionMatrix: {
      truePositives: 7890,
      trueNegatives: 4138,
      falsePositives: 1245,
      falseNegatives: 2147
    },
    featureImportance: [
      { feature: 'Price Momentum', importance: 0.28 },
      { feature: 'Volume Profile', importance: 0.22 },
      { feature: 'Order Flow', importance: 0.18 },
      { feature: 'Market Breadth', importance: 0.15 },
      { feature: 'Historical Patterns', importance: 0.17 }
    ]
  };
}

// Generate performance history
function generatePerformanceHistory() {
  const history = [];
  const now = Date.now();
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600000).toISOString(); // Hourly data
    history.push({
      timestamp,
      accuracy: 0.75 + (Math.random() * 0.1),
      predictions: Math.floor(Math.random() * 100) + 500,
      correct: Math.floor(Math.random() * 50) + 400
    });
  }
  
  return history;
}

// Update ML model status periodically
export function startMLUpdates() {
  setInterval(() => {
    // Simulate model performance updates
    const predictions = generateMLPredictions();
    const correctPredictions = Math.floor(predictions.length * (0.75 + Math.random() * 0.1));
    
    mlModelStatus.totalPredictions += predictions.length;
    mlModelStatus.correctPredictions += correctPredictions;
    mlModelStatus.accuracy = mlModelStatus.correctPredictions / mlModelStatus.totalPredictions;
    mlModelStatus.lastUpdated = new Date().toISOString();
    
    logger.debug('ML model status updated');
  }, 60000); // Update every minute
  
  logger.info('ML updates started');
}

// Get predictions for specific symbol
export function getPredictionsForSymbol(symbol) {
  const allPredictions = generateMLPredictions();
  return allPredictions.find(p => p.symbol === symbol) || null;
}

// Get top predictions
export function getTopPredictions(limit = 10) {
  return generateMLPredictions().slice(0, limit);
}
