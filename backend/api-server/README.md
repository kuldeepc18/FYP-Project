# KTrade API Server

Backend API server for the KTrade Trading Platform with QuestDB integration.

## Features

✅ **User Authentication** - JWT-based authentication for users and admins
✅ **Market Data API** - Real-time market quotes, search, and order book depth
✅ **Order Management** - Place, cancel, and track orders
✅ **Portfolio Management** - Track positions and holdings
✅ **Admin Panel APIs** - Market monitoring, order book, trade history
✅ **ML Predictions** - Machine learning-powered price predictions
✅ **Surveillance System** - Market manipulation detection and alerts
✅ **WebSocket Support** - Real-time market data streaming

## Prerequisites

- Node.js 18+ or Bun
- QuestDB installed and running

## QuestDB Setup

1. Make sure QuestDB is running:
```bash
# If QuestDB is installed as a service
sudo systemctl status questdb

# Or start it manually
questdb start
```

2. QuestDB default settings:
   - HTTP Port: 9000
   - PostgreSQL Wire Protocol Port: 8812
   - Web Console: http://localhost:9000

## Installation

1. Install dependencies:
```bash
cd backend/api-server
npm install
```

2. Configure environment:
```bash
# Edit .env file if needed
# Make sure QUESTDB_PORT=8812 (PostgreSQL wire protocol port)
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on http://localhost:3000

## API Endpoints

### User Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

#### Market Data
- `GET /api/market/quotes` - Get all market quotes
- `GET /api/market/search?q={query}` - Search instruments
- `GET /api/market/orderbook/:symbol` - Get order book depth
- `GET /api/market/historical/:symbol` - Get historical OHLCV data
- `GET /api/market/quote/:symbol` - Get single instrument quote

#### Orders
- `POST /api/orders` - Place new order
- `GET /api/orders` - Get user orders
- `DELETE /api/orders/:id` - Cancel order

#### Portfolio
- `GET /api/portfolio/positions` - Get open positions
- `GET /api/portfolio/holdings` - Get holdings

### Admin Endpoints

#### Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout

#### Market Administration
- `GET /api/admin/market/symbols` - Get all market symbols
- `GET /api/admin/market/data` - Get market statistics

#### Order Book Management
- `GET /api/admin/orders/book` - Get all order book entries
- `GET /api/admin/orders/history` - Get order history

#### Trade Management
- `GET /api/admin/trades/history` - Get trade history
- `GET /api/admin/trades/stats` - Get trade statistics

#### ML & Predictions
- `GET /api/admin/ml/predictions` - Get ML predictions
- `GET /api/admin/ml/metrics` - Get ML model metrics

#### Surveillance
- `GET /api/admin/surveillance/alerts` - Get surveillance alerts
- `GET /api/admin/surveillance/alerts/:id` - Get alert by ID
- `PATCH /api/admin/surveillance/alerts/:id` - Update alert status
- `GET /api/admin/surveillance/patterns` - Get suspicious patterns

## WebSocket

Connect to `ws://localhost:3000`

### Events

**Client → Server:**
- `subscribe` - Subscribe to a channel
  ```json
  { "channel": "tick:RELIANCE" }
  ```
- `unsubscribe` - Unsubscribe from a channel

**Server → Client:**
- `market_update` - Real-time market data updates
  ```json
  {
    "type": "market_update",
    "data": {
      "symbol": "RELIANCE",
      "price": 1550.00,
      "change": 15.50,
      "changePercent": 1.01,
      ...
    }
  }
  ```

## Default Credentials

### Admin User
- Email: `admin@sentinel.com`
- Password: `admin123`

### Test User
Register a new user via `/api/auth/register`

## Supported Instruments

15 Indian market instruments are pre-configured:

**Stocks:**
- RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK
- HINDUNILVR, ITC, SBIN, BHARTIARTL, KOTAKBANK
- LT, AXISBANK

**Indices:**
- NIFTY50, BANKNIFTY, SENSEX

## Architecture

```
backend/api-server/
├── config/           # Database configuration
├── middleware/       # Auth middleware
├── routes/           # API route handlers
│   ├── admin/       # Admin routes
│   └── ...          # User routes
├── services/         # Business logic
│   ├── authService.js
│   ├── marketService.js
│   ├── orderService.js
│   ├── mlService.js
│   └── surveillanceService.js
├── utils/            # Utilities
├── logs/             # Log files
└── server.js         # Main server file
```

## Features in Detail

### Market Data Service
- Real-time price updates every 2 seconds
- Simulated market data with realistic volatility
- Order book depth visualization
- Historical OHLCV data generation

### Order Matching Engine
- FIFO price-time priority matching
- Market and limit orders supported
- Instant execution for market orders
- Balance validation before order placement
- Position tracking with P&L calculation

### ML Predictions
- Price prediction with confidence scores
- Direction indicators (BULLISH/BEARISH/NEUTRAL)
- Model performance metrics
- Feature importance analysis

### Surveillance System
- Price anomaly detection
- Volume spike detection
- Wash trading detection
- Layering/spoofing detection
- Pump & dump detection
- Real-time alert generation

## Database Schema

QuestDB tables are automatically created on first run:
- `users` - User accounts and balances
- `orders` - Order history
- `trades` - Executed trades
- `positions` - User positions
- `admin_users` - Admin accounts
- `surveillance_alerts` - Surveillance alerts
- `market_data` - Market data cache

## Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## Environment Variables

See `.env` file for all configuration options.

## Troubleshooting

### QuestDB Connection Issues
```bash
# Check if QuestDB is running
sudo systemctl status questdb

# Check if port 8812 is listening
netstat -tuln | grep 8812

# Restart QuestDB
sudo systemctl restart questdb
```

### Database Schema Issues
If tables don't exist, the server will create them automatically on startup.

### WebSocket Connection Issues
Make sure CORS settings in `.env` match your frontend URLs.

## Development

### Adding New Endpoints
1. Create route handler in `routes/`
2. Add business logic in `services/`
3. Register route in `server.js`

### Adding New Surveillance Rules
Implement detection logic in `services/surveillanceService.js`

## Production Deployment

1. Update environment variables in `.env`
2. Set `NODE_ENV=production`
3. Use a process manager like PM2:
```bash
pm2 start server.js --name ktrade-api
```

## License

MIT
