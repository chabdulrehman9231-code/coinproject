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

const TOP_COINS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];

export default function LiveCryptoCard() {
  const router = useRouter();
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});

  useEffect(() => {
    // Initial Load via REST API
    fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(res => res.json())
      .then(dataArray => {
        if (Array.isArray(dataArray)) {
          const initial: Record<string, TickerData> = {};
          for (const data of dataArray) {
            if (TOP_COINS.includes(data.symbol)) {
              const changePercent = parseFloat(data.priceChangePercent);
              initial[data.symbol] = {
                symbol: data.symbol,
                baseAsset: data.symbol.replace('USDT', ''),
                price: parseFloat(data.lastPrice).toFixed(data.symbol.includes('DOGE') || data.symbol.includes('XRP') ? 4 : 2),
                change: changePercent.toFixed(2),
                isPositive: changePercent >= 0,
                volume: parseFloat(data.quoteVolume)
              };
            }
          }
          setTickers(initial);
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
            if (Object.keys(prev).length === 0) return prev;
            const next = { ...prev };
            let updated = false;
            
            for (const data of dataArray) {
              if (data.s && TOP_COINS.includes(data.s) && data.c && data.P) {
                const changePercent = parseFloat(data.P);
                next[data.s] = {
                  symbol: data.s,
                  baseAsset: data.s.replace('USDT', ''),
                  price: parseFloat(data.c).toFixed(data.s.includes('DOGE') || data.s.includes('XRP') ? 4 : 2),
                  change: changePercent.toFixed(2),
                  isPositive: changePercent >= 0,
                  volume: parseFloat(data.q)
                };
                updated = true;
              }
            }
            return updated ? next : prev;
          });
        }
      } catch (err) {}
    };

    return () => ws.close();
  }, []);

  const displayCoins = useMemo(() => {
    // Sort based on the order defined in TOP_COINS
    return Object.values(tickers).sort((a, b) => {
      return TOP_COINS.indexOf(a.symbol) - TOP_COINS.indexOf(b.symbol);
    });
  }, [tickers]);

  return (
    <div className="w-full bg-[#111] border border-white/10 rounded-2xl md:rounded-[32px] overflow-hidden shadow-2xl">
      <div className="p-6 md:p-8 border-b border-white/5">
        <h2 className="text-2xl font-bold">Live Markets</h2>
        <p className="text-gray-400 text-sm mt-1">Real-time prices from Binance</p>
      </div>
      
      <div className="overflow-x-auto">
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
                  onClick={() => router.push(`/trade?symbol=${coin.symbol}`)}
                >
                  <td className="py-5 px-6 md:px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden">
                        <img src={`https://assets.coincap.io/assets/icons/${coin.baseAsset.toLowerCase()}@2x.png`} alt={coin.baseAsset} className="w-6 h-6 object-cover" onError={(e) => { e.currentTarget.src = 'https://assets.coincap.io/assets/icons/btc@2x.png'; }} />
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
      <div className="p-6 text-center border-t border-white/5">
         <button onClick={() => router.push('/trade')} className="text-gray-400 hover:text-white font-medium flex items-center justify-center gap-1 mx-auto transition-colors">
            View All Markets <ChevronRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
