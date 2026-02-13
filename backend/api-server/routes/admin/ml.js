import express from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import * as mlService from '../../services/mlService.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('admin-ml-routes');

// Get ML predictions
router.get('/predictions', authenticateAdmin, (req, res) => {
  try {
    const { symbol, limit = 10 } = req.query;
    
    if (symbol) {
      const prediction = mlService.getPredictionsForSymbol(symbol);
      res.json(prediction ? [prediction] : []);
    } else {
      const predictions = mlService.getTopPredictions(parseInt(limit));
      res.json(predictions);
    }
  } catch (error) {
    logger.error('Get predictions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ML metrics
router.get('/metrics', authenticateAdmin, (req, res) => {
  try {
    const metrics = mlService.getMLMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Get ML metrics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
