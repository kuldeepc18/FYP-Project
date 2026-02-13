# KTrade Trading Platform - Quick Start Guide

## 🚀 Complete Backend Implementation

✅ **ALL MISSING BACKEND FEATURES HAVE BEEN IMPLEMENTED!**

The backend API server is now complete with:
- User & Admin authentication
- Market data APIs
- Order management with instant matching
- Portfolio tracking
- ML predictions
- Surveillance monitoring
- WebSocket real-time updates
- QuestDB database integration

---

## 📦 Prerequisites

Before starting, make sure you have:

1. **Node.js 18+** installed
2. **QuestDB** installed and configured (you mentioned it's already set up)
3. **npm** or **bun** package manager

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start QuestDB

```bash
# If QuestDB is installed as a service
sudo systemctl start questdb

# Or if you have it in a directory
cd ~/questdb
./bin/questdb.sh start

# Or use our helper script
cd backend/api-server
./start-questdb.sh
```

Verify QuestDB is running: http://localhost:9000

### Step 2: Start Backend API Server

```bash
cd backend/api-server

# Option A: Use the automatic startup script (recommended)
./start-all.sh

# Option B: Manual start
npm start        # or npm run dev for development mode
```

The server will start on: http://localhost:3000

### Step 3: Start Frontend(s)

**User Frontend:**
```bash
cd frontend_user/ktrade-studio-pro-main
npm run dev
```
Access at: http://localhost:8080

**Admin Frontend:**
```bash
cd frontend_admin/sentinel-console-main
npm run dev
```
Access at: http://localhost:5174

---

## 🔑 Default Credentials

### Admin Panel Login (Admin Frontend Only)
- **Email**: `admin@sentinel.com`
- **Password**: `admin123`
- **Note**: Use these ONLY on the Admin Panel at http://localhost:5174

### User Frontend Login
**You must register a new account first!** Admin credentials won't work on the user frontend.

Create a new account through the user frontend or API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Your Name"
  }'
```

New users get ₹50,00,000 starting balance.

---

## 📍 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| API Server | http://localhost:3000 | REST API endpoints |
| WebSocket | ws://localhost:3000 | Real-time data stream |
| QuestDB Console | http://localhost:9000 | Database web interface |
| User Frontend | http://localhost:8080 | Trading interface |
| Admin Frontend | http://localhost:5174 | Admin console |

---

## 🧪 Quick API Tests

### Test Market Data
```bash
# Get all stock quotes
curl http://localhost:3000/api/market/quotes

# Search for a stock
curl http://localhost:3000/api/market/search?q=RELIANCE
```

### Test Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## 📦 Available Trading Instruments

**Stocks:** RELIANCE, TCS, HDFCBANK, INFY, ICICIBANK, HINDUNILVR, ITC, SBIN, BHARTIARTL, KOTAKBANK, LT, AXISBANK

**Indices:** NIFTY50, BANKNIFTY, SENSEX

---

## 🛠️ Troubleshooting

### Issue: "QuestDB connection refused"

**Solution:**
```bash
# Check if QuestDB is running
netstat -tuln | grep 8812

# Start QuestDB
cd ~/questdb && ./bin/questdb.sh start
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change the port in backend/api-server/.env
PORT=3001
```

### Issue: "Module not found"

**Solution:**
```bash
cd backend/api-server
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Documentation

- **Complete Implementation Report**: [BACKEND_IMPLEMENTATION_COMPLETE.md](BACKEND_IMPLEMENTATION_COMPLETE.md)
- **Missing Features Analysis**: [MISSING_BACKEND_IMPLEMENTATIONS.md](MISSING_BACKEND_IMPLEMENTATIONS.md)
- **API Documentation**: [backend/api-server/README.md](backend/api-server/README.md)

---

## 🔄 Stop All Services

```bash
cd backend/api-server
./stop-all.sh
```

---

## ✅ What's Implemented

### REST API Endpoints (40+)
- ✅ User Authentication (register, login, logout, me)
- ✅ Market Data (quotes, search, orderbook, historical)
- ✅ Order Management (place, cancel, list)
- ✅ Portfolio (positions, holdings, P&L)
- ✅ Admin Authentication
- ✅ Admin Market Data (symbols, statistics)
- ✅ Admin Order Book & Trade History
- ✅ ML Predictions (price forecasts, confidence)
- ✅ Surveillance (alerts, patterns, monitoring)

### Real-time Features
- ✅ WebSocket server with channel subscriptions
- ✅ Live market data updates (every 2 seconds)
- ✅ Order status notifications
- ✅ Trade execution alerts

### Backend Services
- ✅ Order matching engine (FIFO)
- ✅ Balance validation & management
- ✅ Position tracking with P&L
- ✅ ML prediction algorithm
- ✅ Surveillance monitoring (6 detection algorithms)
- ✅ Market data simulation

### Database
- ✅ QuestDB integration
- ✅ 7 tables with time-series partitioning
- ✅ Automatic schema initialization
- ✅ Connection pooling

---

## 🎯 Next Steps

1. **Start all services** using the commands above
2. **Test the API** using the curl commands or frontend
3. **Place sample orders** through the trading interface
4. **Monitor trades** in the admin panel
5. **Check surveillance alerts** for market anomalies

---

## 💡 Tips

- Use `npm run dev` for development (auto-restart on changes)
- Check logs in `backend/api-server/logs/` for debugging
- QuestDB console at http://localhost:9000 for database queries
- WebSocket connections auto-reconnect on disconnect

---

## 🆘 Need Help?

If you encounter any issues:

1. Check server logs: `tail -f backend/api-server/logs/combined.log`
2. Verify QuestDB is running: http://localhost:9000
3. Ensure port 3000 is available: `lsof -i:3000`
4. Review the error messages in the console

---

**Status**: ✅ Backend 100% Complete | Ready for Production Testing

**Date**: February 13, 2026
