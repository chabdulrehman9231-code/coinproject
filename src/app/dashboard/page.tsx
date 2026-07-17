'use client';
import { useState, useEffect, useMemo } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { 
  Bell, User, HeadphonesIcon, TrendingUp, TrendingDown, Clock, 
  ArrowRight, ShieldCheck, Zap, MessageSquare, Menu, FileText, Upload, History, Search, Eye, EyeOff, RefreshCw, Download, Crown 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import UserDrawer from '@/components/UserDrawer';
import DepositModal from '@/components/DepositModal';
import WithdrawModal from '@/components/WithdrawModal';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance } from './actions';

interface TickerData {
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  baseAsset: string;
  volume: number;
}

let cachedDashboardTickers: Record<string, TickerData> | null = null;

export default function DashboardPage() {
  const router = useRouter();
  const [tickers, setTickers] = useState<Record<string, TickerData>>(cachedDashboardTickers || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [creditScore, setCreditScore] = useState<number>(700);
  const [vipLevel, setVipLevel] = useState<string>('Bronze');
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const supabase = createClient();

  const fetchBalance = async () => {
    setIsRefreshing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      // Check verification status
      const { data: userData } = await supabase.from('users').select('is_verified').eq('id', session.user.id).single();
      if (userData && userData.is_verified === false) {
        router.push(`/verify-otp?email=${encodeURIComponent(session.user.email || '')}`);
        return;
      }

      const res = await getUserBalance(session.user.id);
      if (res.success) {
        setBalance(res.balance || 0);
        setCreditScore(res.creditScore ?? 700);
        setVipLevel(res.vipLevel || 'Bronze');
      }
      
      // Fetch unread chat messages
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .neq('sender_id', session.user.id)
        .eq('is_read', false);
      
      if (count) setUnreadChatCount(count);
    }
    setTimeout(() => setIsRefreshing(false), 500); // Add a small delay for visual feedback
  };

  useEffect(() => {
    fetchBalance();

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
          setTickers(prev => {
            const merged = { ...prev, ...initial };
            cachedDashboardTickers = merged;
            return merged;
          });
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
            
            if (updated) {
              cachedDashboardTickers = next;
              return next;
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("WebSocket message parsing error:", err);
      }
    };

    ws.onerror = (error) => {
      console.warn("WebSocket Error:", error);
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3">
        {/* Left: Logo */}
        <div className="flex items-center">
           <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm0-10.667c2.946 0 5.333-2.387 5.333-5.333S18.946 10.667 16 10.667 10.667 13.054 10.667 16s2.387 5.333 5.333 5.333z" fill="#0052FF"/>
           </svg>
        </div>
        
        {/* Right: Notification & Profile */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer">
            <Bell className="h-6 w-6 text-gray-300" />
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#0a0a0a]" />
          </div>
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-8 h-8 rounded-full border border-[#0052FF] flex items-center justify-center cursor-pointer hover:bg-[#0052FF]/10 transition-colors"
          >
            <User className="w-5 h-5 text-[#0052FF]" />
          </div>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 overflow-y-auto pb-20 w-full">
        <div className="max-w-[1200px] mx-auto w-full flex flex-col">
        
        {/* Total Portfolio Value Card */}
        <div className="px-4 mt-6">
          <div className="w-full rounded-2xl bg-[#161616] p-5 md:p-6 border border-white/5 relative flex flex-col gap-5 shadow-lg">
            {/* Top section with balances */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm text-gray-400 font-medium">Total Portfolio Value</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {showBalance ? `$${balance.toFixed(2)}` : '******'}
                  </span>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <button onClick={() => setShowBalance(!showBalance)} className="hover:text-gray-300 transition-colors p-1">
                      {showBalance ? <Eye className="w-4 h-4 md:w-5 md:h-5" /> : <EyeOff className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <button onClick={fetchBalance} disabled={isRefreshing} className="hover:text-gray-300 transition-colors p-1">
                      <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin text-[#0052FF]' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* NEW: Credit Score & VIP Badges */}
              <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs shadow-lg backdrop-blur-md ${
                  vipLevel === 'Diamond' ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-blue-500/30' :
                  vipLevel === 'Gold' ? 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 text-yellow-500 border-yellow-500/30' :
                  vipLevel === 'Silver' ? 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 text-gray-300 border-gray-400/30' :
                  'bg-gradient-to-r from-orange-800/20 to-orange-600/20 text-orange-600 border-orange-700/30'
                }`}>
                  <Crown className="w-4 h-4" />
                  <span className="uppercase tracking-wider">{vipLevel} VIP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111] border border-[#333] font-bold text-xs text-gray-300 shadow-inner">
                  <ShieldCheck className={`w-4 h-4 ${creditScore >= 750 ? 'text-[#00C29A]' : creditScore >= 600 ? 'text-yellow-500' : 'text-red-500'}`} />
                  <span>Credit Score: <span className={creditScore >= 750 ? 'text-[#00C29A]' : creditScore >= 600 ? 'text-yellow-500' : 'text-red-500'}>{creditScore}</span></span>
                </div>
              </div>

            </div>

            {/* Bottom section with buttons */}
            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
              <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-[#0052FF] hover:bg-[#0052FF]/90 text-white px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all">
                <Download className="w-4 h-4" /> Deposit
              </button>
              <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 text-white px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all">
                <Upload className="w-4 h-4" /> Withdraw
              </button>
              <button onClick={() => router.push('/chat')} className="relative flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-white/5 text-white px-3 md:px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all min-w-[100px]">
                <HeadphonesIcon className="w-4 h-4" /> Support
                {unreadChatCount > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#161616]">
                    {unreadChatCount}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex justify-evenly gap-4 px-4 py-6 mt-2 border-b border-[#1a1a1a] max-w-sm mx-auto w-full">
          {[
            { icon: Zap, label: 'Option', path: '/option', badge: true },
            { icon: MessageSquare, label: 'Chat', path: '/chat' },
            { icon: History, label: 'Trade History', path: '/trade-history' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <div 
                key={i} 
                className="flex flex-col items-center gap-2 relative cursor-pointer"
                onClick={() => action.path ? router.push(action.path) : null}
              >
                <div className="w-12 h-12 rounded-full bg-[#161616] flex items-center justify-center relative">
                  <Icon className="h-5 w-5 text-[#0052FF]" />
                  {action.path === '/chat' && unreadChatCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold border border-[#0a0a0a]">
                      {unreadChatCount}
                    </div>
                  )}
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
            <h3 className="text-sm font-bold text-[#0052FF] bg-[#0a0a0a] px-3 relative z-10">Markets</h3>
          </div>
          
          <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search coin (e.g. BTC)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161616] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0052FF] transition-colors"
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
        </div>
      </main>

      <BottomNav />
      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <DepositModal 
        isOpen={isDepositModalOpen} 
        onClose={() => {
          setIsDepositModalOpen(false);
          fetchBalance(); // Refresh balance when modal closes in case admin approved it quickly
        }} 
      />
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => {
          setIsWithdrawModalOpen(false);
          fetchBalance(); // Refresh balance when modal closes
        }} 
      />
    </div>
  );
}
