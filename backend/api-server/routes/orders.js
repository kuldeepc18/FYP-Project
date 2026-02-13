import express from 'express';
import { authenticateUser } from '../middleware/auth.js';
import * as orderService from '../services/orderService.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('order-routes');

// Place order
router.post('/', authenticateUser, async (req, res) => {
  try {
    const orderData = req.body;
    const userId = req.userId;
    
    // Validate required fields
    if (!orderData.symbol || !orderData.side || !orderData.type || !orderData.quantity) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const order = await orderService.placeOrder(userId, orderData);
    res.json(order);
  } catch (error) {
    logger.error('Place order error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get user orders
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;
    
    const orders = await orderService.getUserOrders(userId, status);
    res.json(orders);
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel order
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const result = await orderService.cancelOrder(userId, id);
    res.json(result);
  } catch (error) {
    logger.error('Cancel order error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
