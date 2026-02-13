import express from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import * as marketService from '../../services/marketService.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('admin-market-routes');

// Get market symbols
router.get('/symbols', authenticateAdmin, (req, res) => {
  try {
    const symbols = marketService.INSTRUMENTS.map(inst => ({
      symbol: inst.symbol,
      name: inst.name,
      type: inst.type,
      exchange: inst.exchange,
      lot: inst.lot
    }));
    res.json(symbols);
  } catch (error) {
    logger.error('Get symbols error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get market data/statistics
router.get('/data', authenticateAdmin, (req, res) => {
  try {
    const stats = marketService.getMarketStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Get market data error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
