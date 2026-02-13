import { useState, useEffect } from "react";
import { getTradeHistory, getMarketInstruments } from "@/data/apiMarketData";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  symbol: string;
  buyOrderId: string;
  sellOrderId: string;
  price: number;
  quantity: number;
  value: number;
  timestamp: string;
  buyerFee: number;
  sellerFee: number;
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

export default function TradeHistory() {
  const [selectedSymbol, setSelectedSymbol] = useState("ALL");
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trades, marketInstruments] = await Promise.all([
          getTradeHistory(selectedSymbol),
          getMarketInstruments()
        ]);
        setTradeHistory(trades);
        setInstruments(marketInstruments);
      } catch (error) {
        console.error('Failed to load trade history:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const filteredTrades =
    selectedSymbol === "ALL"
      ? tradeHistory
      : tradeHistory.filter((t) => t.symbol === selectedSymbol);

  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const totalVolume = filteredTrades.reduce((sum, t) => sum + t.value, 0);
  const buyVolume = filteredTrades.filter((t) => t.buyOrderId).reduce((sum, t) => sum + t.value, 0);
  const sellVolume = filteredTrades.filter((t) => t.sellOrderId).reduce((sum, t) => sum + t.value, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Trade History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All executed trades across the platform
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Total Trades</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{filteredTrades.length}</p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Total Volume</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              ${formatNumber(totalVolume)}
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Buy Volume</p>
            <p className="text-2xl font-semibold text-positive mt-1">
              ${formatNumber(buyVolume)}
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Sell Volume</p>
            <p className="text-2xl font-semibold text-negative mt-1">
              ${formatNumber(sellVolume)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedSymbol("ALL")}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            selectedSymbol === "ALL"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          All Instruments
        </button>
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

      {/* Trade History Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Executed Trades</h2>
          <span className="text-xs text-muted-foreground">System-wide trade log</span>
        </div>
        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Symbol</th>
                <th className="text-right">Price</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Total</th>
                <th>Buy Order ID</th>
                <th>Sell Order ID</th>
                <th className="text-right">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className="font-mono text-xs text-muted-foreground">{trade.id}</td>
                  <td className="font-medium text-foreground">{trade.symbol}</td>
                  <td className="text-right font-mono">${formatNumber(trade.price, 4)}</td>
                  <td className="text-right font-mono">{formatNumber(trade.quantity, 4)}</td>
                  <td className="text-right font-mono text-foreground">
                    ${formatNumber(trade.value)}
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{trade.buyOrderId}</td>
                  <td className="font-mono text-xs text-muted-foreground">{trade.sellOrderId}</td>
                  <td className="text-right font-mono text-xs text-muted-foreground">
                    {formatTime(trade.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
