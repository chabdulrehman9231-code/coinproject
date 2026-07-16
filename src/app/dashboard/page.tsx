'use client';
import { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { Bell, Clock, Zap, FileText, Share2, MessageSquare, Search, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserDrawer from '@/components/UserDrawer';

interface TickerData {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  baseAsset: string;
  volume: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tickers, setTickers] = useState<Record<string, TickerData>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    // 1. Initial Load via REST API for instant data
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
          setTickers(initial);
        }
      })
      .catch(err => console.error("Error fetching initial tickers:", err));

    // 2. Setup WebSocket for LIVE updates
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/!ticker@arr`);

    ws.onmessage = (event) => {
      try {
        let dataArray = JSON.parse(event.data);
        
        // Handle both raw array and stream wrapped formats
        if (dataArray.data && Array.isArray(dataArray.data)) {
          dataArray = dataArray.data;
        }

        if (Array.isArray(dataArray)) {
          setTickers(prev => {
            // Only update if we already have initial data to prevent weird race conditions
            if (Object.keys(prev).length === 0) return prev;
            
            const next = { ...prev };
            let updated = false;
            
            for (const data of dataArray) {
              // Ensure object has required fields
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
            
            return updated ? next : prev;
          });
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  const filteredAndSortedTickers = useMemo(() => {
    return Object.values(tickers)
      .filter(t => t.baseAsset.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 100); // Show top 100 to maintain smooth performance
  }, [tickers, searchQuery]);

  const topGainers = useMemo(() => {
    return Object.values(tickers)
      .sort((a, b) => parseFloat(b.change) - parseFloat(a.change))
      .slice(0, 3);
  }, [tickers]);

  const displayGainers = topGainers.length >= 3 ? topGainers : [
    { symbol: 'BTCUSDT', baseAsset: 'BTC', price: '...', change: '0.00', isPositive: true },
    { symbol: 'ETHUSDT', baseAsset: 'ETH', price: '...', change: '0.00', isPositive: true },
    { symbol: 'BNBUSDT', baseAsset: 'BNB', price: '...', change: '0.00', isPositive: true }
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 relative">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-8 h-8 rounded-full border border-[#0066FF] flex items-center justify-center cursor-pointer hover:bg-[#0066FF]/10 transition-colors"
          >
            <User className="w-5 h-5 text-[#0066FF]" />
          </div>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
           <svg 
            width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
           >
              <path d="M24 8L8 36H40L24 8Z" fill="#0066FF" opacity="0.8"/>
              <path d="M24 16L14 36H34L24 16Z" fill="#00C29A" opacity="0.9"/>
           </svg>
        </div>
        <div className="relative">
          <Bell className="h-6 w-6 text-gray-300" />
          <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#0a0a0a]" />
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto pb-20">
        
        <div className="px-4 mt-2">
        <div className="relative">
          <div className="w-full h-[140px] rounded-[20px] bg-gradient-to-br from-[#0066FF] to-[#3385ff] p-6 relative overflow-hidden flex flex-col justify-center shadow-lg shadow-[#0066FF]/20">
            <h2 className="text-3xl font-extrabold text-white z-10 leading-tight tracking-wide drop-shadow-sm">
              Coinbase<br />Trrades
            </h2>
            <p className="text-xs font-semibold mt-2 z-10 text-white/90 drop-shadow-sm">Trade Crypto Seamlessly</p>
            
            {/* Abstract background shapes */}
            <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute left-[-20px] bottom-[-20px] w-32 h-32 bg-[#0066FF]/40 rounded-full blur-xl" />
            
            {/* Premium Logo on the right */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 bg-white/10 rounded-2xl rotate-12 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
               <svg 
                width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
               >
                  <path d="M24 8L8 36H40L24 8Z" fill="#0066FF" opacity="1"/>
                  <path d="M24 16L14 36H34L24 16Z" fill="#0066FF" opacity="1"/>
               </svg>
            </div>
          </div>
          
          <div className="flex justify-center gap-1.5 mt-3">
            <div className="w-5 h-1.5 rounded-full bg-[#0066FF] transition-all" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600 transition-all" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-600 transition-all" />
          </div>
        </div>
        </div>

        {/* Top Cards (Gainers) */}
        <div className="flex px-4 gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {displayGainers.map((data: any) => {
            return (
              <div 
                key={data.symbol} 
                onClick={() => data.price !== '...' && router.push(`/trade?symbol=${data.symbol}`)}
                className="min-w-[110px] flex-1 rounded-xl bg-[#161616] p-3 flex flex-col items-center shadow-sm cursor-pointer hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-400 font-medium mb-1">
                    {data.baseAsset}/USDT
                  </span>
                  <span className={`text-lg font-bold ${data.isPositive ? 'text-[#0066FF]' : 'text-red-500'}`}>
                    {data.price}
                  </span>
                  <span className={`text-xs font-medium ${data.isPositive ? 'text-[#0066FF]' : 'text-red-500'} mt-0.5`}>
                    {data.isPositive && data.price !== '...' ? '+' : ''}{data.change}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-5 gap-2 px-4 py-6 mt-2 border-b border-[#1a1a1a]">
          {[
            { icon: Clock, label: 'Finance' },
            { icon: Zap, label: 'Option', badge: true },
            { icon: FileText, label: 'Docs' },
            { icon: Share2, label: 'Share' },
            { icon: MessageSquare, label: 'Chat', path: '/chat' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center gap-2 relative cursor-pointer"
                onClick={() => action.path ? router.push(action.path) : null}
              >
                <div className="w-12 h-12 rounded-full bg-[#161616] flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#0066FF]" />
                </div>
                {action.badge && (
                  <div className="absolute top-0 right-1 w-3 h-3 bg-red-500 rounded-full border border-[#0a0a0a]" />
                )}
                <span className="text-[10px] text-gray-300 font-medium">{action.label}</span>
              </div>
            );
          })}
        </div>

        {/* Markets List */}
      <div className="flex-1 mt-4 flex flex-col min-h-0 bg-[#0a0a0a]">
        <div className="px-4 sticky top-0 bg-[#0a0a0a] z-10">
          <div className="flex items-center justify-center py-3 relative">
            <div className="absolute w-full h-[1px] bg-[#1a1a1a] top-1/2 -translate-y-1/2" />
            <h3 className="text-sm font-bold text-[#0066FF] bg-[#0a0a0a] px-3 relative z-10">Markets</h3>
          </div>
          
          <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search coin (e.g. BTC)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0066FF] transition-colors"
              />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-medium px-2">
            <span className="w-1/3">Pair</span>
            <span className="w-1/3 text-right">Latest Price</span>
            <span className="w-1/3 text-right">24H Change</span>
          </div>
        </div>

        {/* Markets List */}
        <div className="flex flex-col px-2">
          {Object.keys(tickers).length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">Loading live markets...</div>
          ) : filteredAndSortedTickers.length === 0 ? (
            <div className="text-center text-gray-500 py-10 text-sm">No coins found.</div>
          ) : (
            filteredAndSortedTickers.map((data) => {
              // High-quality reliable crypto icons from CoinCap
              const iconUrl = `https://assets.coincap.io/assets/icons/${data.baseAsset.toLowerCase()}@2x.png`;
              
              return (
                <div 
                  key={data.symbol} 
                  onClick={() => router.push(`/trade?symbol=${data.symbol}`)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#161616] cursor-pointer transition-colors"
                >
                  {/* Coin Info */}
                  <div className="flex items-center gap-3 w-1/3">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={iconUrl} 
                        alt={data.baseAsset} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to text initials if logo not found
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          if (target.nextSibling) {
                            (target.nextSibling as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                      <div className="w-full h-full hidden items-center justify-center text-[10px] font-bold text-gray-300">
                        {data.baseAsset.substring(0, 2)}
                      </div>
                    </div>
                    <div className="flex items-baseline overflow-hidden">
                      <span className="font-bold text-white truncate">{data.baseAsset}</span>
                      <span className="text-[10px] text-gray-400 font-medium">/USDT</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="w-1/3 text-right">
                    <span className="font-bold text-sm truncate">{data.price}</span>
                  </div>

                  {/* Change */}
                  <div className="w-1/3 flex justify-end">
                    <div className={`w-[72px] h-[32px] flex items-center justify-center rounded-[4px] font-bold text-xs
                      ${data.isPositive ? 'bg-[#00C29A] text-black' : 'bg-red-500 text-white'}
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
      </main>

      <BottomNav />
      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
}
