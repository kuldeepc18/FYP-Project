import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/database.js';
import { createLogger } from './utils/logger.js';
import * as authService from './services/authService.js';
import * as marketService from './services/marketService.js';
import * as orderService from './services/orderService.js';
import * as mlService from './services/mlService.js';
import * as surveillanceService from './services/surveillanceService.js';

// Import routes
import authRoutes from './routes/auth.js';
import marketRoutes from './routes/market.js';
import orderRoutes from './routes/orders.js';
import portfolioRoutes from './routes/portfolio.js';
import adminAuthRoutes from './routes/admin/auth.js';
import adminMarketRoutes from './routes/admin/market.js';
import adminOrderRoutes from './routes/admin/orders.js';
import adminTradeRoutes from './routes/admin/trades.js';
import adminMlRoutes from './routes/admin/ml.js';
import adminSurveillanceRoutes from './routes/admin/surveillance.js';

// Load environment variables
dotenv.config();

const logger = createLogger('server');

// Create Express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'KTrade API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      userAuth: '/api/auth/*',
      market: '/api/market/*',
      orders: '/api/orders/*',
      portfolio: '/api/portfolio/*',
      adminAuth: '/api/admin/auth/*',
      adminPanel: '/api/admin/*'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// User API routes
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/portfolio', portfolioRoutes);

// Admin API routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/market', adminMarketRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/trades', adminTradeRoutes);
app.use('/api/admin/ml', adminMlRoutes);
app.use('/api/admin/surveillance', adminSurveillanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Express error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);
  
  // Handle channel subscriptions
  socket.on('subscribe', ({ channel }) => {
    socket.join(channel);
    logger.debug(`Client ${socket.id} subscribed to ${channel}`);
    
    // Send initial data for the channel
    if (channel.startsWith('tick:')) {
      const symbol = channel.substring(5);
      const quote = marketService.getQuote(symbol);
      if (quote) {
        socket.emit('market_update', {
          type: 'market_update',
          data: quote
        });
      }
    }
  });
  
  // Handle unsubscribe
  socket.on('unsubscribe', ({ channel }) => {
    socket.leave(channel);
    logger.debug(`Client ${socket.id} unsubscribed from ${channel}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Initialize and start server
async function startServer() {
  try {
    logger.info('Starting KTrade API Server...');
    
    // Initialize database (non-blocking)
    const dbInitialized = await initializeDatabase();
    if (dbInitialized) {
      logger.info('✅ Database initialized successfully');
      
      // Create default admin user (only if DB is connected)
      await authService.createDefaultAdmin();
    } else {
      logger.warn('⚠️  Starting server without database connection');
      logger.warn('⚠️  Some features will not work until QuestDB is started');
    }
    
    // Initialize services
    orderService.initializeOrderBook();
    marketService.startMarketDataUpdates(io);
    mlService.startMLUpdates();
    surveillanceService.startSurveillanceMonitoring();
    
    logger.info('All services initialized');
    
    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      logger.info(`=================================================`);
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`🔌 WebSocket server running on ws://localhost:${PORT}`);
      logger.info(`📊 Market data updates: ACTIVE`);
      logger.info(`🤖 ML predictions: ACTIVE`);
      logger.info(`👮 Surveillance monitoring: ACTIVE`);
      if (!dbInitialized) {
        logger.warn(`⚠️  QuestDB: NOT CONNECTED`);
        logger.warn(`⚠️  Run ./start-questdb.sh to start QuestDB`);
      } else {
        logger.info(`💾 QuestDB: CONNECTED`);
      }
      logger.info(`=================================================`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();
