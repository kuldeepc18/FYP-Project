import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as orderService from '../services/orderService.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('portfolio-routes');

// Get user positions
router.get('/positions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const positions = await orderService.getUserPositions(userId);
    res.json(positions);
  } catch (error) {
    logger.error('Get positions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user holdings
router.get('/holdings', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const holdings = await orderService.getUserHoldings(userId);
    res.json(holdings);
  } catch (error) {
    logger.error('Get holdings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
