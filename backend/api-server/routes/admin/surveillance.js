import express from 'express';
import { authenticateAdmin } from '../../middleware/auth.js';
import * as surveillanceService from '../../services/surveillanceService.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('admin-surveillance-routes');

// Get surveillance alerts
router.get('/alerts', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    const alerts = await surveillanceService.getAllAlerts(parseInt(limit), status);
    res.json(alerts);
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get alert by ID
router.get('/alerts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await surveillanceService.getAlertById(parseInt(id));
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.json(alert);
  } catch (error) {
    logger.error('Get alert by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update alert status
router.patch('/alerts/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    await surveillanceService.updateAlertStatus(parseInt(id), status);
    res.json({ success: true, message: 'Alert status updated' });
  } catch (error) {
    logger.error('Update alert status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get suspicious patterns
router.get('/patterns', authenticateAdmin, (req, res) => {
  try {
    const patterns = surveillanceService.getSuspiciousPatterns();
    res.json(patterns);
  } catch (error) {
    logger.error('Get patterns error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
