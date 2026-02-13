import express from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import * as orderService from '../../services/orderService.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('admin-trade-routes');

// Get trade history
router.get('/history', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const trades = await orderService.getAllTrades(parseInt(limit));
    res.json(trades);
  } catch (error) {
    logger.error('Get trade history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get trade statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await orderService.getTradeStatistics();
    res.json(stats);
  } catch (error) {
    logger.error('Get trade stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
