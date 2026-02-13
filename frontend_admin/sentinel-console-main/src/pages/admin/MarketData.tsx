import { useState, useEffect } from "react";
import { getMarketInstruments, type MarketInstrument } from "@/data/apiMarketData";
import { cn } from "@/lib/utils";

export default function MarketData() {
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getMarketInstruments();
      setInstruments(data);
      setLoading(false);
    };
    loadData();
    
    // Refresh data every 5 seconds
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);
  const formatNumber = (num: number, decimals = 2) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatVolume = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toString();
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
          <h1 className="text-xl font-semibold text-foreground">Market Data</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete market data for all instruments across the platform
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="data-label">Last Update</span>
          <span className="data-value font-mono">{formatTime(new Date().toISOString())}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Total Instruments</p>
            <p className="text-2xl font-semibold text-foreground mt-1">{instruments.length}</p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">24h Volume</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              ${formatVolume(instruments.reduce((sum, i) => sum + i.volume, 0))}
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Gainers</p>
            <p className="text-2xl font-semibold text-positive mt-1">
              {instruments.filter((i) => i.change > 0).length}
            </p>
          </div>
        </div>
        <div className="panel">
          <div className="p-4">
            <p className="data-label">Losers</p>
            <p className="text-2xl font-semibold text-negative mt-1">
              {instruments.filter((i) => i.change < 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Market Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">All Instruments</h2>
          <span className="text-xs text-muted-foreground">
            Real-time aggregated data
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="terminal-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th className="text-right">Last Price</th>
                <th className="text-right">24h Change</th>
                <th className="text-right">24h %</th>
                <th className="text-right">24h Volume</th>
                <th className="text-right">24h High</th>
                <th className="text-right">24h Low</th>
                <th className="text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((instrument) => (
                <tr key={instrument.symbol}>
                  <td className="font-medium text-foreground">{instrument.symbol}</td>
                  <td className="text-muted-foreground">{instrument.name}</td>
                  <td className="text-right font-mono">
                    ${formatNumber(instrument.lastPrice, instrument.lastPrice < 1 ? 4 : 2)}
                  </td>
                  <td
                    className={cn(
                      "text-right font-mono",
                      instrument.change > 0 ? "text-positive" : "text-negative"
                    )}
                  >
                    {instrument.change > 0 ? "+" : ""}
                    {formatNumber(instrument.change, instrument.lastPrice < 1 ? 4 : 2)}
                  </td>
                  <td
                    className={cn(
                      "text-right font-mono",
                      instrument.changePercent > 0 ? "text-positive" : "text-negative"
                    )}
                  >
                    {instrument.changePercent > 0 ? "+" : ""}
                    {formatNumber(instrument.changePercent)}%
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    ${formatVolume(instrument.volume)}
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    ${formatNumber(instrument.high24h, instrument.lastPrice < 1 ? 4 : 2)}
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    ${formatNumber(instrument.low24h, instrument.lastPrice < 1 ? 4 : 2)}
                  </td>
                  <td className="text-right font-mono text-xs text-muted-foreground">
                    {formatTime(instrument.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
