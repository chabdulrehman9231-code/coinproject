'use client';
import { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TickerData {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  baseAsset: string;
  volume: number;
}

interface MarketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  baseRoute?: string;
}

let cachedMarketTickers: Record<string, TickerData> | null = null;

export default function MarketSelector({ isOpen, onClose, currentSymbol, baseRoute = '/trade' }: MarketSelectorProps) {
  const router = useRouter();
  const [tickers, setTickers] = useState<Record<string, TickerData>>(cachedMarketTickers || {});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Initial Load via REST API
    fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(res => res.json())
      .then(dataArray => {
        if (Array.isArray(dataArray)) {
          const initial: Record<string, TickerData> = {};
          for (const data of dataArray) {
            if (data.symbol.endsWith('USDT')) {
              const changePercent = parseFloat(data.priceChangePercent);
              initial[data.symbol] = {
                symbol: data.symbol,
                baseAsset: data.symbol.replace('USDT', ''),
                price: parseFloat(data.lastPrice).toFixed(data.symbol.includes('DOGE') || data.symbol.includes('ADA') || data.symbol.includes('SHIB') || data.symbol.includes('PEPE') ? 5 : 2),
                change: changePercent.toFixed(2),
                isPositive: changePercent >= 0,
                volume: parseFloat(data.quoteVolume)
              };
            }
          }
          setTickers(prev => {
            const merged = { ...prev, ...initial };
            cachedMarketTickers = merged;
            return merged;
          });
        }
      })
      .catch(err => console.warn("Error fetching initial tickers:", err));

    // Setup WebSocket for LIVE updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/!ticker@arr`);

    ws.onmessage = (event) => {
      try {
        let dataArray = JSON.parse(event.data);
        if (dataArray.data && Array.isArray(dataArray.data)) dataArray = dataArray.data;

        if (Array.isArray(dataArray)) {
          setTickers(prev => {
            if (Object.keys(prev).length === 0) return prev;
            const next = { ...prev };
            let updated = false;
            
            for (const data of dataArray) {
              if (data.s && data.s.endsWith('USDT') && data.c && data.P) {
                const changePercent = parseFloat(data.P);
                next[data.s] = {
                  symbol: data.s,
                  baseAsset: data.s.replace('USDT', ''),
                  price: parseFloat(data.c).toFixed(data.s.includes('DOGE') || data.s.includes('ADA') || data.s.includes('SHIB') || data.s.includes('PEPE') ? 5 : 2),
                  change: changePercent.toFixed(2),
                  isPositive: changePercent >= 0,
                  volume: parseFloat(data.q)
                };
                updated = true;
              }
            }
            if (updated) {
              cachedMarketTickers = next;
              return next;
            }
            return prev;
          });
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, [isOpen]);

  const filteredAndSortedTickers = useMemo(() => {
    return Object.values(tickers)
      .filter(t => t.baseAsset.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 100);
  }, [tickers, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col text-white animate-in slide-in-from-left">
      <div className="max-w-[1200px] mx-auto w-full flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[#1a1a1a]">
        <button onClick={onClose} className="p-1 hover:bg-[#1a1a1a] rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-400" />
        </button>
        <h2 className="text-lg font-bold">Markets</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[#1a1a1a]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            autoFocus
            placeholder="Search coin (e.g. BTC)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#161616] border border-[#1a1a1a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0052FF] transition-colors"
          />
        </div>
      </div>

      {/* Table Header */}
      <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 font-medium border-b border-[#1a1a1a]">
        <span className="w-1/3">Pair</span>
        <span className="w-1/3 text-right">Last Price</span>
        <span className="w-1/3 text-right">24H Change</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedTickers.length === 0 ? (
          <div className="text-center text-gray-500 py-10">Loading markets...</div>
        ) : (
          filteredAndSortedTickers.map((data) => {
            const isCurrent = data.symbol === currentSymbol;
            return (
              <div 
                key={data.symbol}
                onClick={() => {
                  if (baseRoute === '/option') {
                    router.push(`/option/${data.baseAsset}_USDT`);
                  } else {
                    router.push(`${baseRoute}?symbol=${data.symbol}`);
                  }
                  onClose();
                }}
                className={`flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]/50 hover:bg-[#161616] cursor-pointer transition-colors ${isCurrent ? 'bg-[#161616]' : ''}`}
              >
                <div className="flex items-baseline w-1/3 overflow-hidden">
                  <span className="font-bold text-white truncate">{data.baseAsset}</span>
                  <span className="text-[10px] text-gray-500 font-medium ml-1">/USDT</span>
                </div>
                <div className="w-1/3 text-right">
                  <span className={`font-bold text-sm ${data.isPositive ? 'text-[#00C29A]' : 'text-red-500'}`}>
                    {data.price}
                  </span>
                </div>
                <div className="w-1/3 flex justify-end">
                  <div className={`w-[72px] h-[32px] flex items-center justify-center rounded-[4px] font-bold text-xs
                    ${data.isPositive ? 'bg-[#00C29A]/10 text-[#00C29A]' : 'bg-red-500/10 text-red-500'}
                  `}>
                    {data.isPositive ? '+' : ''}{data.change}%
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
}
