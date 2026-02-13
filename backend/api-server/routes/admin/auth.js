import express from 'express';
import * as authService from '../../services/authService.js';
import { createLogger } from '../../utils/logger.js';

const router = express.Router();
const logger = createLogger('admin-auth-routes');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }
    
    const result = await authService.adminLogin(email, password);
    res.json(result);
  } catch (error) {
    logger.error('Admin login error:', error);
    res.status(401).json({ message: error.message });
  }
});

// Admin logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Admin logged out successfully' });
});

export default router;
