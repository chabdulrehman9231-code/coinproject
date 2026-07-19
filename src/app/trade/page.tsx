'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Menu, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import AdvancedTradingChart from "@/components/AdvancedTradingChart";
import OrderForm from "@/components/OrderForm";
import MarketSelector from "@/components/MarketSelector";
import Header from "@/components/Header";

interface TickerStats {
  price: string;
  change: string;
  isPositive: boolean;
  high: string;
  low: string;
  volume: string;
}

const formatVolume = (volStr: string) => {
  const vol = parseFloat(volStr);
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + 'B';
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(2) + 'K';
  return vol.toFixed(2);
};

import { Suspense } from "react";

function TradeContent() {
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
    low: "0.00",
    volume: "0.00"
  });

  const [activeTab, setActiveTab] = useState<'trade'|'orders'>('trade');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);

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
            low: parseFloat(data.lowPrice).toFixed(isSmall ? 5 : 2),
            volume: formatVolume(data.quoteVolume)
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
          low: parseFloat(data.l).toFixed(isSmall ? 5 : 2),
          volume: formatVolume(data.q)
        });
      }
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden h-14 items-center justify-between px-4 border-b border-[#1a1a1a]">
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
      
      <main className="flex-1 overflow-hidden flex flex-col pb-0 w-full">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col h-full overflow-hidden">
        {/* Ticker Info Card */}
        <div className="mx-4 mt-4 bg-[#161616] rounded-2xl p-4 md:p-5 border border-[#1a1a1a] flex justify-between items-center shrink-0">
          <div 
            className="flex flex-col gap-1 cursor-pointer group" 
            onClick={() => setIsMarketSelectorOpen(true)}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white">${stats.price}</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
                {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stats.isPositive ? '+' : ''}{stats.change}%
              </span>
            </div>
            <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors flex items-center gap-1">
              {baseAsset}/USDT • Live <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
            </span>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-500 mb-0.5">24h High</span>
              <span className="text-sm font-bold text-[#00C29A]">${stats.high}</span>
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs text-gray-500 mb-0.5">24h Low</span>
              <span className="text-sm font-bold text-[#ff5f6e]">${stats.low}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-0.5">Volume(24h)</span>
              <span className="text-sm font-bold text-white">{stats.volume}</span>
            </div>
          </div>
        </div>
        
        {/* Live Chart Area */}
        <div className="w-full flex-1 border-b border-[#1a1a1a] min-h-0 relative mt-4">
          <AdvancedTradingChart symbol={symbol} />
        </div>
        
        {/* Tabs */}
        <div className="flex px-4 shrink-0 border-b border-[#1a1a1a]">
          <div className="flex-1 flex justify-center">
            <button 
              className={`py-3 text-[15px] font-medium px-4 ${activeTab === 'trade' ? 'text-[#BF953F] border-b-2 border-[#BF953F]' : 'text-gray-500'}`}
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

export default function TradePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-[#00C29A]">Loading...</div>}>
      <TradeContent />
    </Suspense>
  );
}
