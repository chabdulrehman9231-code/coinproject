'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";
import TradingChart from "@/components/TradingChart";
import OrderForm from "@/components/OrderForm";
import MarketSelector from "@/components/MarketSelector";

interface TickerStats {
  price: string;
  change: string;
  isPositive: boolean;
  high: string;
  low: string;
}

export default function TradePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSymbol = searchParams.get('symbol');
  const symbol = (rawSymbol || "BTCUSDT").toUpperCase();
  const baseAsset = symbol.replace('USDT', '');
  
  const [stats, setStats] = useState<TickerStats>({
    price: "0.00",
    change: "0.00",
    isPositive: true,
    high: "0.00",
    low: "0.00"
  });

  const [activeTab, setActiveTab] = useState<'trade'|'orders'>('trade');
  const [activeTimeframe, setActiveTimeframe] = useState('1min');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);

  const mapTimeframeToInterval = (tf: string) => {
    switch (tf) {
      case '1min': return '1m';
      case '5min': return '5m';
      case '30min': return '30m';
      case '1H': return '1h';
      case '4H': return '4h';
      case '1D': return '1d';
      default: return '1m';
    }
  };

  useEffect(() => {
    // Fetch initial data via REST for instant load
    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
      .then(res => res.json())
      .then(data => {
        if (data.lastPrice) {
          const changePercent = parseFloat(data.priceChangePercent);
          const isSmall = symbol.includes('DOGE') || symbol.includes('SHIB') || symbol.includes('PEPE');
          setStats({
            price: parseFloat(data.lastPrice).toFixed(isSmall ? 5 : 2),
            change: changePercent.toFixed(2),
            isPositive: changePercent >= 0,
            high: parseFloat(data.highPrice).toFixed(isSmall ? 5 : 2),
            low: parseFloat(data.lowPrice).toFixed(isSmall ? 5 : 2)
          });
        }
      })
      .catch(err => console.error(err));

    // Live update via WebSocket
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === '24hrTicker') {
        const changePercent = parseFloat(data.P);
        const isSmall = symbol.includes('DOGE') || symbol.includes('SHIB') || symbol.includes('PEPE');
        setStats({
          price: parseFloat(data.c).toFixed(isSmall ? 5 : 2),
          change: changePercent.toFixed(2),
          isPositive: changePercent >= 0,
          high: parseFloat(data.h).toFixed(isSmall ? 5 : 2),
          low: parseFloat(data.l).toFixed(isSmall ? 5 : 2)
        });
      }
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0a0a0a] text-white">
      {/* Mobile Header */}
      <header className="flex h-14 items-center justify-between px-4 border-b border-[#1a1a1a]">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 p-1 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <button 
          onClick={() => setIsMarketSelectorOpen(true)}
          className="flex items-center gap-2 hover:bg-[#1a1a1a] px-3 py-1.5 rounded-lg transition-colors"
        >
          <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
            <img 
              src={`https://assets.coincap.io/assets/icons/${baseAsset.toLowerCase()}@2x.png`}
              alt={baseAsset}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.nextSibling) {
                  (target.nextSibling as HTMLElement).style.display = 'flex';
                }
              }}
            />
            <div className="w-full h-full hidden items-center justify-center text-[8px] font-bold text-gray-300">
              {baseAsset.substring(0, 2)}
            </div>
          </div>
          <h1 className="text-lg font-bold">{baseAsset}/USDT</h1>
          <Menu className="w-4 h-4 text-gray-400 ml-1" />
        </button>
        
        <div className="w-6" /> {/* Placeholder to balance flex */}
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col pb-0">
        {/* Ticker Info */}
        <div className="flex justify-between px-4 py-3 shrink-0">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className={`text-3xl font-bold ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
                {stats.price}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#00C29A] bg-[#00C29A]/10 px-1.5 py-0.5 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C29A] animate-pulse" />
                LIVE
              </div>
            </div>
            <span className={`text-sm font-medium mt-1 ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
              {stats.isPositive ? '+' : ''}{stats.change}%
            </span>
          </div>
          
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-gray-500">24H High / Low</span>
            <span className="text-xs font-medium text-white mt-0.5">{stats.high}</span>
            <span className="text-xs font-medium text-white">{stats.low}</span>
          </div>
        </div>
        
        {/* Timeframe Selector */}
        <div className="flex gap-4 px-4 py-3 mt-1 shrink-0 text-[13px] font-medium text-gray-500">
          {['1min', '5min', '30min', '1H', '4H', '1D'].map((time) => (
            <button 
              key={time}
              onClick={() => setActiveTimeframe(time)}
              className={`${activeTimeframe === time ? 'text-[#0066FF]' : 'hover:text-gray-300'}`}
            >
              {time}
            </button>
          ))}
        </div>
        
        {/* Live Chart Area */}
        <div className="w-full flex-1 border-b border-[#1a1a1a] min-h-0 relative">
          <TradingChart symbol={symbol} interval={mapTimeframeToInterval(activeTimeframe)} />
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 shrink-0 border-b border-[#1a1a1a]">
          <div className="flex-1 flex justify-center">
            <button 
              className={`py-3 text-[15px] font-medium px-4 ${activeTab === 'trade' ? 'text-[#0066FF] border-b-2 border-[#0066FF]' : 'text-gray-500'}`}
              onClick={() => setActiveTab('trade')}
            >
              Trade
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <button 
              className={`py-3 text-[15px] font-medium px-4 ${activeTab === 'orders' ? 'text-white border-b-2 border-transparent' : 'text-gray-500'}`}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="shrink-0 pt-2">
          {activeTab === 'trade' ? (
            <OrderForm symbol={symbol} />
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-gray-500">
              No open orders
            </div>
          )}
        </div>
      </main>

      {/* Market Selector Drawer */}
      <MarketSelector 
        isOpen={isMarketSelectorOpen} 
        onClose={() => setIsMarketSelectorOpen(false)} 
        currentSymbol={symbol} 
      />
    </div>
  );
}
