import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { createLogger } from '../utils/logger.js';

dotenv.config();

const logger = createLogger('database');

// QuestDB connection pool
const pool = new Pool({
  host: process.env.QUESTDB_HOST || 'localhost',
  port: parseInt(process.env.QUESTDB_PORT) || 8812,
  user: process.env.QUESTDB_USER || 'admin',
  password: process.env.QUESTDB_PASSWORD || 'quest',
  database: process.env.QUESTDB_DATABASE || 'qdb',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
  logger.info('Connected to QuestDB');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  // Don't exit, just log the error
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    return false;
  }
}

// Initialize database schema
export async function initializeDatabase() {
  // Test connection first
  const isConnected = await testConnection();
  if (!isConnected) {
    logger.warn('⚠️  QuestDB is not running or not accessible');
    logger.warn('⚠️  Database operations will fail until QuestDB is started');
    logger.warn('⚠️  Run: ./start-questdb.sh to start QuestDB');
    return false;
  }
  
  const client = await pool.connect();
  
  try {
    logger.info('Initializing database schema...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SYMBOL capacity 256 CACHE,
        email SYMBOL capacity 256 CACHE,
        password_hash STRING,
        name STRING,
        balance DOUBLE,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
      ) timestamp(created_at) PARTITION BY DAY;
    `);
    
    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SYMBOL capacity 1000 CACHE,
        user_id SYMBOL capacity 256 CACHE,
        instrument_id INT,
        symbol SYMBOL capacity 100 CACHE,
        side SYMBOL capacity 10 CACHE,
        type SYMBOL capacity 20 CACHE,
        quantity INT,
        price DOUBLE,
        stop_price DOUBLE,
        target_price DOUBLE,
        stop_loss DOUBLE,
        status SYMBOL capacity 20 CACHE,
        validity SYMBOL capacity 10 CACHE,
        filled_quantity INT,
        average_price DOUBLE,
        fees DOUBLE,
        created_at TIMESTAMP,
        filled_at TIMESTAMP,
        cancelled_at TIMESTAMP
      ) timestamp(created_at) PARTITION BY DAY;
    `);
    
    // Create trades table
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id LONG,
        buy_order_id SYMBOL capacity 1000 CACHE,
        sell_order_id SYMBOL capacity 1000 CACHE,
        symbol SYMBOL capacity 100 CACHE,
        price DOUBLE,
        quantity INT,
        buyer_user_id SYMBOL capacity 256 CACHE,
        seller_user_id SYMBOL capacity 256 CACHE,
        executed_at TIMESTAMP
      ) timestamp(executed_at) PARTITION BY DAY;
    `);
    
    // Create positions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id LONG,
        user_id SYMBOL capacity 256 CACHE,
        symbol SYMBOL capacity 100 CACHE,
        quantity INT,
        average_price DOUBLE,
        current_price DOUBLE,
        unrealized_pnl DOUBLE,
        realized_pnl DOUBLE,
        updated_at TIMESTAMP
      ) timestamp(updated_at) PARTITION BY DAY;
    `);
    
    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SYMBOL capacity 256 CACHE,
        email SYMBOL capacity 256 CACHE,
        password_hash STRING,
        name STRING,
        role SYMBOL capacity 50 CACHE,
        created_at TIMESTAMP
      ) timestamp(created_at) PARTITION BY DAY;
    `);
    
    // Create surveillance_alerts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS surveillance_alerts (
        id LONG,
        type SYMBOL capacity 50 CACHE,
        severity SYMBOL capacity 20 CACHE,
        symbol SYMBOL capacity 100 CACHE,
        description STRING,
        detected_at TIMESTAMP,
        status SYMBOL capacity 20 CACHE,
        resolved_at TIMESTAMP
      ) timestamp(detected_at) PARTITION BY DAY;
    `);
    
    // Create market_data table for caching
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_data (
        symbol SYMBOL capacity 100 CACHE,
        price DOUBLE,
        change DOUBLE,
        change_percent DOUBLE,
        volume LONG,
        high DOUBLE,
        low DOUBLE,
        open DOUBLE,
        previous_close DOUBLE,
        updated_at TIMESTAMP
      ) timestamp(updated_at) PARTITION BY DAY;
    `);
    
    logger.info('Database schema initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing database:', error);
    logger.error('Make sure QuestDB is running on port 8812');
    return false;
  } finally {
    client.release();
  }
}

// Query helper
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error: error.message });
    throw error;
  }
}

// Get a client from the pool
export async function getClient() {
  return await pool.connect();
}

export default pool;
