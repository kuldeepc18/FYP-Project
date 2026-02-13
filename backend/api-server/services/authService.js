import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('auth-service');

export async function registerUser(email, password, name) {
  try {
    // Check if user already exists
    const existingUser = await query(
      `SELECT * FROM users WHERE email = '${email}' LIMIT 1`
    );
    
    if (existingUser.rows && existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate user ID
    const userId = `USR${uuidv4().substring(0, 8)}`;
    
    // Create user
    const now = new Date().toISOString();
    await query(
      `INSERT INTO users (id, email, password_hash, name, balance, created_at, updated_at) 
       VALUES ('${userId}', '${email}', '${passwordHash}', '${name}', 5000000.0, '${now}', '${now}')`
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    logger.info(`User registered: ${email}`);
    
    return {
      token,
      user: {
        id: userId,
        email,
        name,
        balance: 5000000.0
      }
    };
  } catch (error) {
    logger.error('Register user error:', error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    // Find user
    const result = await query(
      `SELECT * FROM users WHERE email = '${email}' LATEST ON created_at PARTITION BY id`
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    logger.info(`User logged in: ${email}`);
    
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        balance: user.balance
      }
    };
  } catch (error) {
    logger.error('Login user error:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const result = await query(
      `SELECT * FROM users WHERE id = '${userId}' LATEST ON created_at PARTITION BY id`
    );
    
    if (!result.rows || result.rows.length === 0) {
      return null;
    }
    
    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      balance: user.balance
    };
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw error;
  }
}

export async function adminLogin(email, password) {
  try {
    // Find admin user
    const result = await query(
      `SELECT * FROM admin_users WHERE email = '${email}' LATEST ON created_at PARTITION BY id`
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }
    
    const admin = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, role: admin.role },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    logger.info(`Admin logged in: ${email}`);
    
    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    };
  } catch (error) {
    logger.error('Admin login error:', error);
    throw error;
  }
}

export async function createDefaultAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@sentinel.com';
    
    // Check if admin already exists
    const existing = await query(
      `SELECT * FROM admin_users WHERE email = '${email}' LIMIT 1`
    );
    
    if (existing.rows && existing.rows.length > 0) {
      logger.info('Default admin already exists');
      return;
    }
    
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);
    const adminId = `ADM${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();
    
    await query(
      `INSERT INTO admin_users (id, email, password_hash, name, role, created_at) 
       VALUES ('${adminId}', '${email}', '${passwordHash}', 'System Admin', 'admin', '${now}')`
    );
    
    logger.info(`Default admin created: ${email}`);
  } catch (error) {
    logger.error('Create default admin error:', error);
  }
}
