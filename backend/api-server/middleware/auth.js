import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-middleware');

export function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.userEmail = decoded.email;
      next();
    } catch (error) {
      logger.error('Token verification failed:', error.message);
      return res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      req.adminId = decoded.adminId;
      req.adminEmail = decoded.email;
      req.adminRole = decoded.role;
      next();
    } catch (error) {
      logger.error('Admin token verification failed:', error.message);
      return res.status(401).json({ message: 'Unauthorized - Invalid admin token' });
    }
  } catch (error) {
    logger.error('Admin auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
