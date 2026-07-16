'use client';
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronLeft, Menu, ChevronDown } from "lucide-react";
import TradingChart from "@/components/TradingChart";
import MarketSelector from "@/components/MarketSelector";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";

interface TickerStats {
  price: string;
  change: string;
  isPositive: boolean;
}

import { Suspense } from "react";

function OptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSymbol = searchParams.get('symbol');
  const symbol = (rawSymbol || "BTCUSDT").toUpperCase();
  const baseAsset = symbol.replace('USDT', '');
  
  const [stats, setStats] = useState<TickerStats>({
    price: "0.00",
    change: "0.00",
    isPositive: true,
  });

  const [activeTimeframe, setActiveTimeframe] = useState('1min');
  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [tradeMode, setTradeMode] = useState<'option'|'futures'>('option');
  const [futuresAction, setFuturesAction] = useState<'long'|'short'>('long');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('asset', 'USDT')
          .single()
          .then(({ data }) => {
            if (data) setBalance(Number(data.balance).toFixed(2));
          });
      }
    });
  }, [supabase]);

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
        });
      }
    };

    return () => ws.close();
  }, [symbol]);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0a0a0a] text-white">
      <Header />
      {/* Header */}
      <header className="flex md:hidden h-14 items-center justify-between px-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 p-1 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        {/* Toggle Option/Futures */}
        <div className="flex bg-[#1a1a1a] rounded-full p-1">
          <button 
            onClick={() => setTradeMode('option')}
            className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-colors ${tradeMode === 'option' ? 'bg-[#0052FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Option
          </button>
          <button 
            onClick={() => setTradeMode('futures')}
            className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm transition-colors ${tradeMode === 'futures' ? 'bg-[#0052FF] text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Futures
          </button>
        </div>
        
        <button onClick={() => setIsMarketSelectorOpen(true)} className="text-gray-400 p-1 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>
      
      <main className="flex-1 overflow-hidden flex flex-col pb-0 relative">
        {/* Ticker Info Row (Shared) */}
        <div className="flex justify-between items-center px-4 py-2 shrink-0">
          <div 
            onClick={() => setIsMarketSelectorOpen(true)}
            className="flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] p-1 -ml-1 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
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
              <div className="w-full h-full hidden items-center justify-center text-[10px] font-bold text-gray-300">
                {baseAsset.substring(0, 2)}
              </div>
            </div>
            <h1 className="text-lg font-bold">{baseAsset}/USDT</h1>
          </div>
          
          <div className="flex items-center gap-2 text-right">
            <span className={`text-lg font-bold ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
              {stats.price}
            </span>
            <span className={`text-sm font-bold ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
              {stats.isPositive ? '+' : ''}{stats.change}%
            </span>
            {tradeMode === 'futures' && (
              <span className="text-gray-400 ml-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </span>
            )}
          </div>
        </div>
        
        {/* Timeframe Selector (Shared) */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b border-[#1a1a1a] text-[13px]">
          <div className="flex gap-4 font-medium text-gray-500">
            <span className="text-gray-600">Time</span>
            {['1 min', '5 min', '30 min', '1H', '4H'].map((time) => {
              const val = time.replace(' ', '');
              return (
                <button 
                  key={time}
                  onClick={() => setActiveTimeframe(val)}
                  className={`${activeTimeframe === val ? 'text-[#0052FF]' : 'hover:text-gray-300'}`}
                >
                  {time}
                </button>
              );
            })}
          </div>
          <button className="flex items-center gap-1 text-gray-500 hover:text-gray-300 font-medium">
            {tradeMode === 'futures' ? 'Index' : 'More'} <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {tradeMode === 'option' ? (
          <>
            {/* Option: Full Live Chart */}
            <div className="w-full flex-1 border-b border-[#1a1a1a] min-h-0 relative">
              <TradingChart symbol={symbol} interval={mapTimeframeToInterval(activeTimeframe)} />
            </div>
            
            {/* Option: Binary Footer Details */}
            <div className="px-4 py-3 shrink-0 text-[13px] font-medium border-b border-[#1a1a1a]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-3 text-[#00C29A]">
                  <span>Open (0)</span>
                  <span className="text-gray-600">|</span>
                  <span className="text-gray-500 hover:text-gray-300 cursor-pointer">History</span>
                </div>
                <div className="text-[#00C29A]">
                  Balance: {balance} USDT
                </div>
              </div>
              
              <div className="flex justify-center text-gray-600 pb-2">
                No open orders
              </div>
            </div>
            
            {/* Option: Up / Down Buttons */}
            <div className="flex gap-4 px-4 py-4 shrink-0 bg-[#0a0a0a]">
              <button className="flex-1 bg-[#00C29A] hover:bg-[#00C29A]/90 text-black font-extrabold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                <span>▲</span> Up
              </button>
              <button className="flex-1 bg-[#ff5f6e] hover:bg-[#ff5f6e]/90 text-white font-extrabold text-lg py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95">
                <span>▼</span> Down
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Futures: Split Chart and Orderbook */}
            <div className="flex flex-1 min-h-0 border-b border-[#1a1a1a]">
              <div className="w-[60%] border-r border-[#1a1a1a] relative">
                <TradingChart symbol={symbol} interval={mapTimeframeToInterval(activeTimeframe)} />
              </div>
              <div className="w-[40%] flex flex-col bg-[#0f0f0f] text-[11px] font-mono">
                <div className="flex justify-between px-2 py-1 text-gray-500 border-b border-[#1a1a1a]">
                  <span>Price</span>
                  <span>Qty</span>
                </div>
                {/* Asks (Sell) */}
                <div className="flex-1 flex flex-col justify-end px-2 py-1 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`ask-${i}`} className="flex justify-between text-[#ff5f6e]">
                      <span>{(parseFloat(stats.price) + (5 - i) * 0.5).toFixed(2)}</span>
                      <span className="text-gray-400">{(Math.random() * 2).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
                {/* Current Price */}
                <div className="flex items-center justify-between px-2 py-1.5 bg-[#1a1a1a]">
                  <span className={`text-[13px] font-bold ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
                    {stats.price}
                  </span>
                  <span className={`text-[#00C29A] font-bold`}>↗</span>
                </div>
                {/* Bids (Buy) */}
                <div className="flex-1 flex flex-col px-2 py-1 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={`bid-${i}`} className="flex justify-between text-[#00C29A]">
                      <span>{(parseFloat(stats.price) - (i + 1) * 0.5).toFixed(2)}</span>
                      <span className="text-gray-400">{(Math.random() * 2).toFixed(3)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Futures: Order Form */}
            <div className="flex flex-col shrink-0 px-4 py-3 pb-safe bg-[#0a0a0a]">
              <div className="flex mb-3 rounded-lg overflow-hidden border border-[#1a1a1a]">
                <button 
                  onClick={() => setFuturesAction('long')}
                  className={`flex-1 py-2 font-bold text-sm transition-colors ${futuresAction === 'long' ? 'bg-[#00C29A] text-black' : 'bg-[#161616] text-gray-400'}`}
                >
                  Buy Long
                </button>
                <button 
                  onClick={() => setFuturesAction('short')}
                  className={`flex-1 py-2 font-bold text-sm transition-colors ${futuresAction === 'short' ? 'bg-[#2a2a2a] text-white' : 'bg-[#161616] text-gray-400'}`}
                >
                  Buy Short
                </button>
              </div>

              <div className="flex items-center justify-between mb-3 text-[13px]">
                <span className="text-gray-400">Multiple</span>
                <button className="flex items-center gap-2 bg-[#161616] border border-[#1a1a1a] rounded px-3 py-1 text-white">
                  x 100 <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="relative mb-1">
                <input 
                  type="number" 
                  placeholder="Please enter" 
                  className="w-full bg-[#161616] border border-[#1a1a1a] rounded-lg py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#00C29A] transition-colors pr-12"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm">
                  <span className="text-gray-500 font-medium">Lot</span>
                  <span className="text-gray-500">{baseAsset}</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-500 mb-4">1 Lot = 1.00 {baseAsset}</span>

              <div className="flex flex-col gap-1.5 text-[11px] mb-4 p-3 bg-[#111111] rounded-lg border border-[#1a1a1a]">
                <div className="flex justify-between"><span className="text-gray-500">Market value (USDT)</span><span className="text-gray-300">≈0.0000</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Margin (USDT)</span><span className="text-gray-300">≈0.0000</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Handling fee (USDT)</span><span className="text-gray-300">≈0.0000</span></div>
                <div className="flex justify-between mt-1 pt-1 border-t border-[#222]"><span className="text-gray-500">Balance (USDT)</span><span className="font-bold text-white">{balance}</span></div>
              </div>

              <button className={`w-full py-3.5 rounded-lg font-bold text-[15px] transition-transform active:scale-95 ${futuresAction === 'long' ? 'bg-[#00C29A] text-black' : 'bg-[#2a2a2a] text-white'}`}>
                {futuresAction === 'long' ? 'Buy Long' : 'Buy Short'}
              </button>

              <div className="flex gap-4 mt-4 text-[13px] border-b border-[#1a1a1a]">
                <button className="text-[#0052FF] border-b-2 border-[#0052FF] pb-2 font-medium">Positions</button>
                <button className="text-gray-500 hover:text-gray-300 pb-2 font-medium">History</button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Market Selector Drawer */}
      <MarketSelector 
        isOpen={isMarketSelectorOpen} 
        onClose={() => setIsMarketSelectorOpen(false)} 
        currentSymbol={symbol}
        baseRoute="/option"
      />
    </div>
  );
}

export default function OptionPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-[#0052FF]">Loading...</div>}>
      <OptionContent />
    </Suspense>
  );
}
