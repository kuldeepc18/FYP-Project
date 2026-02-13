import express from 'express';
import * as marketService from '../services/marketService.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('market-routes');

// Get all quotes
router.get('/quotes', (req, res) => {
  try {
    const quotes = marketService.getAllQuotes();
    res.json(quotes);
  } catch (error) {
    logger.error('Get quotes error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search instruments
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Missing search query' });
    }
    
    const results = marketService.searchInstruments(q);
    res.json(results);
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get order book depth
router.get('/orderbook/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const orderBook = marketService.getOrderBook(symbol);
    
    if (!orderBook) {
      return res.status(404).json({ message: 'Symbol not found' });
    }
    
    res.json(orderBook);
  } catch (error) {
    logger.error('Get order book error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get historical data
router.get('/historical/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const { interval = '1m', limit = 100 } = req.query;
    
    const data = marketService.getHistoricalData(symbol, interval, parseInt(limit));
    res.json(data);
  } catch (error) {
    logger.error('Get historical data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single quote
router.get('/quote/:symbol', (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = marketService.getQuote(symbol);
    
    if (!quote) {
      return res.status(404).json({ message: 'Symbol not found' });
    }
    
    res.json(quote);
  } catch (error) {
    logger.error('Get quote error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
