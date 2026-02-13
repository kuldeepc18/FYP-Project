import express from 'express';
import * as authService from '../services/authService.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('auth-routes');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const result = await authService.registerUser(email, password, name);
    res.json(result);
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing email or password' });
    }
    
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({ message: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7);
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    logger.error('Get me error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
});

export default router;
