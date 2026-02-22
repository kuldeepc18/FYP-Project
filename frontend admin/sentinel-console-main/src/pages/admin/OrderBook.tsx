import { useState, useEffect } from "react";
import { getOrderBook, getMarketInstruments } from "@/data/apiMarketData";
import { cn } from "@/lib/utils";

interface OrderBookEntry {
  symbol: string;
  side: 'BID' | 'ASK';
  price: number;
  quantity: number;
  totalValue: number;
  timestamp: string;
}

interface MarketInstrument {
  symbol: string;
  name: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export default function OrderBook() {
  const [selectedSymbol, setSelectedSymbol] = useState("RELIANCE.NSE");
  const [orderBookData, setOrderBookData] = useState<OrderBookEntry[]>([]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [orders, marketInstruments] = await Promise.all([
          getOrderBook(selectedSymbol),
          getMarketInstruments()
        ]);
        setOrderBookData(orders);
        setInstruments(marketInstruments);
      } catch (error) {
        console.error('Failed to load order book data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const filteredOrders = orderBookData.filter((o) => o.symbol === selectedSymbol);
  const bids = filteredOrders.filter((o) => o.side === "BID").sort((a, b) => b.price - a.price);
  const asks = filteredOrders.filter((o) => o.side === "ASK").sort((a, b) => a.price - b.price);

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Order Book Monitoring</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Full order book data for all instruments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="data-label">Monitoring Until</span>
            <span className="text-sm font-mono text-warning">8th January</span>
          </div>
        </div>
      </div>

      {/* Symbol Selector */}
      <div className="flex gap-2">
        {instruments.slice(0, 4).map((instrument) => (
          <button
            key={instrument.symbol}
            onClick={() => setSelectedSymbol(instrument.symbol)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              selectedSymbol === instrument.symbol
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {instrument.symbol}
          </button>
        ))}
      </div>

      {/* Order Book Split View */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title text-positive">Bids</h2>
            <span className="text-xs text-muted-foreground">{bids.length} orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Price</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Source</th>
                  <th className="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-positive">${formatNumber(order.price)}</td>
                    <td className="text-right font-mono">{formatNumber(order.quantity, 4)}</td>
                    <td className="text-right font-mono text-muted-foreground">
                      ${formatNumber(order.total)}
                    </td>
                    <td className="text-right">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          order.source === "MODEL"
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {order.source}
                      </span>
                    </td>
                    <td className="text-right font-mono text-xs text-muted-foreground">
                      {formatTime(order.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Asks */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title text-negative">Asks</h2>
            <span className="text-xs text-muted-foreground">{asks.length} orders</span>
          </div>
          <div className="overflow-x-auto">
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>Price</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Source</th>
                  <th className="text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {asks.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono text-negative">${formatNumber(order.price)}</td>
                    <td className="text-right font-mono">{formatNumber(order.quantity, 4)}</td>
                    <td className="text-right font-mono text-muted-foreground">
                      ${formatNumber(order.total)}
                    </td>
                    <td className="text-right">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          order.source === "MODEL"
                            ? "bg-primary/20 text-primary"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {order.source}
                      </span>
                    </td>
                    <td className="text-right font-mono text-xs text-muted-foreground">
                      {formatTime(order.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-secondary" />
          <span className="text-muted-foreground">Real Market Data</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-primary/20" />
          <span className="text-muted-foreground">Model-Generated Output</span>
        </div>
      </div>
    </div>
  );
}
