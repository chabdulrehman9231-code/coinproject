'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  baseAsset: string;
  volume: number;
}

let cachedTickers: Record<string, TickerData> | null = null;

export default function LiveCryptoCard() {
  const router = useRouter();
  const [tickers, setTickers] = useState<Record<string, TickerData>>(cachedTickers || {});

  useEffect(() => {
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
                price: parseFloat(data.lastPrice).toFixed(data.symbol.includes('DOGE') || data.symbol.includes('XRP') || data.symbol.includes('SHIB') || data.symbol.includes('PEPE') || data.symbol.includes('ADA') ? 5 : 2),
                change: changePercent.toFixed(2),
                isPositive: changePercent >= 0,
                volume: parseFloat(data.quoteVolume)
              };
            }
          }
          setTickers(initial);
          cachedTickers = initial;
        }
      })
      .catch(err => console.error("Error fetching initial tickers:", err));

    // Setup WebSocket for LIVE updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/!ticker@arr`);

    ws.onmessage = (event) => {
      try {
        let dataArray = JSON.parse(event.data);
        if (dataArray.data && Array.isArray(dataArray.data)) dataArray = dataArray.data;

        if (Array.isArray(dataArray)) {
          setTickers(prev => {
            const next = { ...prev };
            let updated = false;
            
            for (const data of dataArray) {
              if (data.s && data.s.endsWith('USDT') && data.c && data.P) {
                const changePercent = parseFloat(data.P);
                next[data.s] = {
                  symbol: data.s,
                  baseAsset: data.s.replace('USDT', ''),
                  price: parseFloat(data.c).toFixed(data.s.includes('DOGE') || data.s.includes('XRP') || data.s.includes('SHIB') || data.s.includes('PEPE') || data.s.includes('ADA') ? 5 : 2),
                  change: changePercent.toFixed(2),
                  isPositive: changePercent >= 0,
                  volume: parseFloat(data.q)
                };
                updated = true;
              }
            }
            if (updated) {
              cachedTickers = next;
              return next;
            }
            return prev;
          });
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  const displayCoins = useMemo(() => {
    return Object.values(tickers)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);
  }, [tickers]);

  return (
    <div className="w-full bg-[#111] border border-white/10 rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8 border-b border-white/5">
        <h2 className="text-2xl font-bold">Live Markets</h2>
        <p className="text-gray-400 text-sm mt-1">Real-time prices from Binance</p>
      </div>
      
      <div className="w-full">
        {/* Mobile View (Cards) */}
        <div className="md:hidden flex flex-col">
          {displayCoins.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Connecting to live feed...</div>
          ) : (
            displayCoins.map((coin, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={coin.symbol} 
                className="flex flex-col gap-3 p-5 border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                onClick={() => router.push('/login')}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                      <img src={`https://assets.coincap.io/assets/icons/${coin.baseAsset.toLowerCase()}@2x.png`} alt={coin.baseAsset} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://assets.coincap.io/assets/icons/btc@2x.png'; }} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[17px] leading-tight">{coin.baseAsset}</span>
                      <span className="text-gray-500 text-xs font-medium mt-0.5">{coin.baseAsset}/USDT</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[17px] block leading-tight">${coin.price}</span>
                    <div className={`flex items-center justify-end gap-1 font-bold text-xs mt-1 ${coin.isPositive ? 'text-[#00C29A]' : 'text-red-500'}`}>
                      {coin.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {coin.isPositive ? '+' : ''}{coin.change}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">24H Volume</span>
                    <span className="text-gray-300 font-medium text-xs">${(coin.volume / 1000000).toFixed(2)}M</span>
                  </div>
                  <button className="text-white font-semibold text-xs bg-[#0052FF] px-4 py-1.5 rounded-full hover:bg-[#0045d8] transition-colors">
                    Trade
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/5 text-gray-500 text-sm">
              <th className="py-4 px-6 md:px-8 font-medium">Asset</th>
              <th className="py-4 px-6 font-medium text-right">Price</th>
              <th className="py-4 px-6 font-medium text-right">24H Change</th>
              <th className="py-4 px-6 font-medium text-right hidden sm:table-cell">24H Volume</th>
              <th className="py-4 px-6 md:px-8 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayCoins.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">Connecting to live feed...</td>
              </tr>
            ) : (
              displayCoins.map((coin, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={coin.symbol} 
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push('/login')}
                >
                  <td className="py-5 px-6 md:px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <img src={`https://assets.coincap.io/assets/icons/${coin.baseAsset.toLowerCase()}@2x.png`} alt={coin.baseAsset} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://assets.coincap.io/assets/icons/btc@2x.png'; }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[17px]">{coin.baseAsset}</span>
                        <span className="text-gray-500 text-xs font-medium">{coin.baseAsset}/USDT</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <span className="font-bold text-[17px]">${coin.price}</span>
                  </td>
                  <td className="py-5 px-6 text-right">
                    <div className={`flex items-center justify-end gap-1 font-bold ${coin.isPositive ? 'text-[#00C29A]' : 'text-red-500'}`}>
                      {coin.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {coin.isPositive ? '+' : ''}{coin.change}%
                    </div>
                  </td>
                  <td className="py-5 px-6 text-right hidden sm:table-cell">
                    <span className="text-gray-400 font-medium">${(coin.volume / 1000000).toFixed(2)}M</span>
                  </td>
                  <td className="py-5 px-6 md:px-8 text-right">
                    <button className="text-[#0052FF] font-semibold text-sm group-hover:bg-[#0052FF] group-hover:text-white px-4 py-2 rounded-full transition-all">
                      Trade
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
      <div className="p-6 text-center border-t border-white/5">
         <button onClick={() => router.push('/login')} className="text-gray-400 hover:text-white font-medium flex items-center justify-center gap-1 mx-auto transition-colors">
            View All Markets <ChevronRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
