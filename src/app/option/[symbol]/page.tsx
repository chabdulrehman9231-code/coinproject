'use client';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Menu, ChevronDown, TrendingUp, TrendingDown, ChevronRight, AlertTriangle } from "lucide-react";
import AdvancedTradingChart from "@/components/AdvancedTradingChart";
import MarketSelector from "@/components/MarketSelector";
import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import { openOptionTrade } from "@/app/option/actions";

interface TickerStats {
  price: string;
  change: string;
  isPositive: boolean;
  high: string;
  low: string;
}

const TIME_FRAMES = [
  { label: '30 sec', profit: 10, min: 100 },
  { label: '60 sec', profit: 20, min: 5000 },
  { label: '120 sec', profit: 30, min: 20000 },
  { label: '180 sec', profit: 50, min: 50000 },
  { label: '240 sec', profit: 70, min: 150000 },
  { label: '300 sec', profit: 90, min: 300000 },
];

function OptionContent() {
  const router = useRouter();
  const params = useParams();
  const rawSymbol = (params?.symbol as string)?.replace('_', '') || 'BTCUSDT';
  const symbol = rawSymbol.toUpperCase();
  const baseAsset = symbol.replace('USDT', '');
  
  const [stats, setStats] = useState<TickerStats>({
    price: "0.00",
    change: "0.00",
    isPositive: true,
    high: "0.00",
    low: "0.00"
  });

  const [isMarketSelectorOpen, setIsMarketSelectorOpen] = useState(false);
  const [balance, setBalance] = useState('0.00');
  const [direction, setDirection] = useState<'UP' | 'DOWN'>('UP');
  const [amount, setAmount] = useState('100');
  const [timeFrame, setTimeFrame] = useState(TIME_FRAMES[0]);
  const [isTimeFrameOpen, setIsTimeFrameOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'open'|'history'>('open');
  
  // Trade Execution States
  const [isPlacingTrade, setIsPlacingTrade] = useState(false);
  const [activeTrade, setActiveTrade] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isWaitingForResult, setIsWaitingForResult] = useState(false);
  const [tradeResult, setTradeResult] = useState<'won' | 'lost' | null>(null);
  const [bufferedResult, setBufferedResult] = useState<any>(null);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

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
          
        supabase
          .from('option_trades')
          .select('*')
          .eq('user_id', user.id)
          .eq('symbol', symbol)
          .neq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20)
          .then(({ data }) => {
            if (data) setTradeHistory(data);
          });
      }
    });
  }, [supabase]);

  useEffect(() => {
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

  // Trade Countdown Timer
  useEffect(() => {
    let timer: any;
    if (activeTrade && countdown > 0 && !isWaitingForResult) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsWaitingForResult(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeTrade, countdown, isWaitingForResult]);

  // Realtime Listener for Admin Resolution
  useEffect(() => {
    if (!activeTrade) return;

    const channel = supabase
      .channel(`trade_${activeTrade.id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'option_trades',
        filter: `id=eq.${activeTrade.id}`
      }, (payload) => {
        const updated = payload.new;
        if (updated.status !== 'pending') {
          setBufferedResult(updated);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTrade, supabase]);

  // Apply buffered result only when timer finishes
  useEffect(() => {
    if (bufferedResult && countdown <= 0) {
      setIsWaitingForResult(false);
      setTradeResult(bufferedResult.status);
      setTradeHistory(prev => [bufferedResult, ...prev]);
      
      if (bufferedResult.status === 'won') {
         const payout = parseFloat(bufferedResult.amount) + (parseFloat(bufferedResult.amount) * (parseFloat(bufferedResult.profit_rate)/100));
         setBalance(prev => (parseFloat(prev) + payout).toFixed(2));
      }
      setBufferedResult(null);
    }
  }, [bufferedResult, countdown]);

  const handleOpenPosition = async () => {
    setIsPlacingTrade(true);
    const timeInSeconds = parseInt(timeFrame.label);
    const res = await openOptionTrade(
      symbol, 
      direction, 
      parseFloat(amount || '0'), 
      timeInSeconds, 
      parseFloat(stats.price), 
      timeFrame.profit
    );
    if (res.success && res.trade) {
      setActiveTrade(res.trade);
      setCountdown(timeInSeconds);
      setIsWaitingForResult(false);
      setTradeResult(null);
      setActiveTab('open'); // switch to open tab
      setBalance((prev) => (parseFloat(prev) - parseFloat(amount || '0')).toFixed(2));
    } else {
      alert(res.error || 'Failed to place trade');
    }
    setIsPlacingTrade(false);
  };

  const potentialProfit = parseFloat(amount || '0') * (timeFrame.profit / 100);
  const totalReturn = parseFloat(amount || '0') + potentialProfit;
  const isBalanceBelowMin = parseFloat(balance) < timeFrame.min;
  const isDisabled = isPlacingTrade || !!activeTrade || isBalanceBelowMin || parseFloat(amount || '0') < timeFrame.min || parseFloat(balance) < parseFloat(amount || '0');

  const sliderPercent = parseFloat(balance) > 0 ? Math.min(100, Math.max(0, (parseFloat(amount || '0') / parseFloat(balance)) * 100)) : 0;

  return (
    <div className="flex h-[100dvh] flex-col bg-[#050505] text-white overflow-hidden">
      <Header />
      
      {/* Mobile Header */}
      <header className="flex md:hidden h-14 items-center justify-between px-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 p-1 hover:text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-bold text-lg">Options</span>
        <button onClick={() => setIsMarketSelectorOpen(true)} className="text-gray-400 p-1 hover:text-white transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto w-full p-4 flex flex-col gap-4">
          
          {/* Ticker Info Card */}
          <div className="bg-[#111111] rounded-2xl p-4 md:p-5 border border-[#1a1a1a] flex justify-between items-center shrink-0">
            <div 
              className="flex flex-col gap-1 cursor-pointer group" 
              onClick={() => setIsMarketSelectorOpen(true)}
            >
              <span className="text-sm text-gray-400 font-medium group-hover:text-white transition-colors flex items-center gap-1 mb-1">
                {baseAsset}/USDT Contract
              </span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-white">${stats.price}</span>
                <span className={`text-sm font-bold flex items-center gap-1 ${stats.isPositive ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>
                  {stats.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stats.isPositive ? '+' : ''}{stats.change}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-right">
              <div className="hidden md:flex flex-col">
                <span className="text-xs text-gray-500 mb-1">24h High</span>
                <span className="text-sm font-bold text-[#00C29A]">${stats.high}</span>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs text-gray-500 mb-1">24h Low</span>
                <span className="text-sm font-bold text-[#ff5f6e]">${stats.low}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Profit Rate</span>
                <span className="text-sm font-bold text-[#EAB308]">{timeFrame.profit}%</span>
              </div>
            </div>
          </div>

          {/* Split Content: Chart + Order Panel */}
          <div className="flex flex-col lg:flex-row gap-4 lg:min-h-[650px]">
            {/* Left: Chart area */}
            <div className="flex-1 bg-[#111111] border border-[#1a1a1a] rounded-2xl overflow-hidden relative min-h-[450px] lg:min-h-0">
              <AdvancedTradingChart symbol={symbol} />
              
              {/* Overlay for Active Trade Timer & Result */}
              {activeTrade && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center w-32 h-32 md:w-48 md:h-48 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    {isWaitingForResult ? (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mb-2 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                        <div className="text-[#EAB308] font-bold text-xs md:text-sm">Waiting...</div>
                      </div>
                    ) : tradeResult ? (
                       <div className="flex flex-col items-center justify-center text-center pointer-events-auto">
                          <div className={`text-xl md:text-2xl font-black mb-1 md:mb-2 uppercase tracking-wider ${tradeResult === 'won' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                            {tradeResult === 'won' ? 'WON' : 'LOST'}
                          </div>
                          <button 
                            onClick={() => {
                              setActiveTrade(null);
                              setTradeResult(null);
                            }}
                            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-bold transition-colors border border-white/20"
                          >
                            Close
                          </button>
                       </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className={`text-3xl md:text-4xl font-extrabold mb-1 font-mono tracking-tighter drop-shadow-md ${activeTrade.direction === 'UP' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                          {countdown}s
                        </div>
                        <div className={`text-[10px] font-bold flex items-center gap-1 uppercase bg-black/40 px-3 py-1 rounded-full ${activeTrade.direction === 'UP' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                          {activeTrade.direction === 'UP' ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>} 
                          {activeTrade.direction}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>

            {/* Right: Order Panel */}
            <div className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl p-4 flex flex-col h-full">
                {/* UP/FALL Buttons */}
                <div className="flex gap-3 mb-6">
                  <button 
                    onClick={() => setDirection('UP')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-colors
                      ${direction === 'UP' ? 'bg-[#00C29A] text-black shadow-[0_0_15px_rgba(0,194,154,0.3)]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}
                  >
                    <TrendingUp className="w-5 h-5" /> UP
                  </button>
                  <button 
                    onClick={() => setDirection('DOWN')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-colors
                      ${direction === 'DOWN' ? 'bg-[#ff5f6e] text-white shadow-[0_0_15px_rgba(255,95,110,0.3)]' : 'bg-[#1a1a1a] text-gray-400 hover:text-white'}`}
                  >
                    <TrendingDown className="w-5 h-5" /> DOWN
                  </button>
                </div>

                {/* Time Frame */}
                {/* Time Frame Dropdown */}
                <div className="mb-6 relative">
                  <div className="flex items-center text-xs text-gray-500 mb-2 gap-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Time Frame
                  </div>
                  
                  <button 
                    onClick={() => setIsTimeFrameOpen(!isTimeFrameOpen)}
                    className={`w-full flex items-center justify-between bg-[#1a1a1a] rounded-xl px-4 py-3 transition-colors border ${isTimeFrameOpen ? 'border-[#EAB308]' : 'border-transparent hover:bg-[#222]'}`}
                  >
                    <span className="font-bold text-white flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#EAB308]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {timeFrame.label}
                    </span>
                    <span className="text-xs font-bold text-[#00C29A] flex items-center gap-1">
                      +{timeFrame.profit}% profit <ChevronDown className={`w-3 h-3 transition-transform ${isTimeFrameOpen ? 'rotate-180' : ''}`} />
                    </span>
                  </button>

                  {isTimeFrameOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden z-20 shadow-2xl">
                      {TIME_FRAMES.map((tf, index) => (
                        <div 
                          key={tf.label}
                          onClick={() => {
                            setTimeFrame(tf);
                            setIsTimeFrameOpen(false);
                          }}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors hover:bg-[#222] ${timeFrame.label === tf.label ? 'border-l-2 border-[#EAB308] bg-[#222]' : 'border-l-2 border-transparent'} ${index !== TIME_FRAMES.length - 1 ? 'border-b border-[#333]' : ''}`}
                        >
                          <span className={`font-bold ${timeFrame.label === tf.label ? 'text-white' : 'text-gray-400'}`}>{tf.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-[#00C29A]">+{tf.profit}%</span>
                            <span className="text-xs text-gray-600 font-medium">min {tf.min >= 1000 ? tf.min / 1000 + 'K' : tf.min} USDT</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Amount */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
                    <span>Amount (USDT)</span>
                    <span>Min: 100</span>
                  </div>
                  <div className="relative mb-4">
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#ff5f6e]/30 rounded-xl px-4 py-3 font-bold text-white focus:outline-none focus:border-[#ff5f6e]"
                    />
                  </div>
                  {/* Functional Slider */}
                  <div className="mt-4 mx-1 mb-2 group">
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={sliderPercent}
                      onChange={(e) => {
                        const percent = parseInt(e.target.value);
                        const val = (parseFloat(balance) * (percent / 100)).toFixed(2);
                        setAmount(val);
                      }}
                      className="w-full h-1.5 rounded-full appearance-none outline-none cursor-pointer transition-all
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 
                        [&::-webkit-slider-thumb]:bg-[#EAB308] [&::-webkit-slider-thumb]:rounded-full 
                        [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#111]
                        [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                      style={{
                        background: `linear-gradient(to right, #EAB308 ${sliderPercent}%, #333 ${sliderPercent}%)`
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-gray-500 font-medium">0%</span>
                      <span className="text-[10px] text-gray-500 font-medium">100%</span>
                    </div>
                  </div>
                </div>

                {/* Balances */}
                <div className="flex flex-col gap-2 text-xs mb-4">
                  <div className="flex justify-between"><span className="text-gray-500">Available Balance</span><span className="text-white">{balance} USDT</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Selected Amount</span><span className="text-[#EAB308] font-bold">{amount || '0'} USDT</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Remaining Balance</span><span className="text-[#ff5f6e]">{(parseFloat(balance) - parseFloat(amount || '0')).toFixed(2)} USDT</span></div>
                </div>

                {/* Warning Box */}
                {isBalanceBelowMin && (
                  <div className="bg-[#EAB308]/10 border border-[#EAB308]/30 rounded-lg p-2.5 flex items-center gap-2 mb-6">
                    <AlertTriangle className="w-4 h-4 text-[#EAB308] shrink-0" />
                    <span className="text-xs text-[#EAB308]">Balance ({balance} USDT) is below the {timeFrame.label} minimum</span>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                  <div className="text-[10px] text-gray-500 mb-3 uppercase tracking-wider">Order Summary</div>
                  <div className="flex flex-col gap-2 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Market</span><span className="text-white font-bold">{baseAsset}/USDT</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Direction</span><span className={`font-bold flex items-center gap-1 ${direction === 'UP' ? 'text-[#00C29A]' : 'text-[#ff5f6e]'}`}>{direction === 'UP' ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>} {direction}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Entry Price</span><span className="text-white font-bold">${stats.price}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="text-white font-bold">{amount || '0'} USDT</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Time Frame</span><span className="text-white font-bold">{timeFrame.label}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Profit Rate</span><span className="text-[#EAB308] font-bold">{timeFrame.profit}%</span></div>
                    
                    <div className="h-px bg-gray-800 my-1"></div>
                    <div className="flex justify-between"><span className="text-gray-400">Potential Profit</span><span className="text-[#00C29A] font-bold">+{potentialProfit.toFixed(2)} USDT</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total Return</span><span className="text-white font-bold">{totalReturn.toFixed(2)} USDT</span></div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    disabled={isDisabled}
                    onClick={handleOpenPosition}
                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-transform 
                      ${isDisabled ? 'bg-[#1a1a1a] text-gray-500 cursor-not-allowed border border-gray-800' : 
                        direction === 'UP' ? 'bg-[#00C29A] text-black hover:bg-[#00C29A]/90 active:scale-95' : 'bg-[#ff5f6e] text-white hover:bg-[#ff5f6e]/90 active:scale-95'}`}
                  >
                    {isPlacingTrade ? (
                       <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : activeTrade ? (
                       <>
                        {activeTrade.direction === 'UP' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>} 
                        Trade in Progress...
                       </>
                    ) : (
                       <>
                        {direction === 'UP' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>} 
                        Open {direction} Position
                       </>
                    )}
                  </button>
                  {/* Warning notice removed */}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Tabs */}
          <div className="mt-2 mb-8 flex flex-col">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('open')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${activeTab === 'open' ? 'bg-[#1a1a1a] text-[#EAB308] border-[#EAB308]/30' : 'text-gray-500 hover:text-white border-transparent'}`}
              >
                Open Positions
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${activeTab === 'history' ? 'bg-[#1a1a1a] text-[#EAB308] border-[#EAB308]/30' : 'text-gray-500 hover:text-white border-transparent'}`}
              >
                Trade History
              </button>
            </div>
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-2xl mt-4 min-h-[200px] flex flex-col p-4">
              {activeTab === 'open' ? (
                activeTrade && !tradeResult ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-[#333] gap-4">
                    {/* Top Row: Icon, Pair, Mobile Timer */}
                    <div className="flex items-center justify-between w-full md:w-auto">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shrink-0 ${activeTrade.direction === 'UP' ? 'bg-[#00C29A]/10 text-[#00C29A]' : 'bg-red-500/10 text-red-500'}`}>
                          {activeTrade.direction === 'UP' ? <TrendingUp className="w-5 h-5 md:w-6 md:h-6"/> : <TrendingDown className="w-5 h-5 md:w-6 md:h-6"/>}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base md:text-lg">{activeTrade.symbol}</div>
                          <div className="text-[10px] md:text-xs text-gray-400">Entry: ${activeTrade.entry_price}</div>
                        </div>
                      </div>
                      
                      {/* Timer for Mobile */}
                      <div className="flex md:hidden flex-col items-end min-w-[60px]">
                        {isWaitingForResult ? (
                          <span className="text-[#EAB308] text-xs font-bold animate-pulse">Wait...</span>
                        ) : (
                          <span className="text-xl font-extrabold text-white">{countdown}s</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Amount and Desktop Timer */}
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t border-[#333] md:border-0 pt-3 md:pt-0">
                      <div className="flex flex-col md:items-end">
                        <div className="font-bold text-white text-sm md:text-base">{activeTrade.amount} USDT</div>
                        <div className="text-[10px] md:text-xs text-[#EAB308]">Potential Win: +{activeTrade.profit_rate}%</div>
                      </div>
                      
                      {/* Timer for Desktop */}
                      <div className="hidden md:flex flex-col items-end min-w-[80px]">
                        {isWaitingForResult ? (
                          <span className="text-[#EAB308] text-sm font-bold animate-pulse">Waiting...</span>
                        ) : (
                          <span className="text-2xl font-extrabold text-white">{countdown}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No active positions</div>
                )
              ) : (
                tradeHistory.length > 0 ? (
                  <div className="w-full">
                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-3 mt-2">
                      {tradeHistory.map(trade => (
                        <div key={trade.id} className="bg-[#1a1a1a] rounded-xl border border-[#333] p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <div className="font-bold text-white text-base">{trade.symbol}</div>
                              <span className={`flex items-center gap-1 text-xs font-bold mt-1 ${trade.direction === 'UP' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                                {trade.direction === 'UP' ? <TrendingUp className="w-3 h-3"/> : <TrendingDown className="w-3 h-3"/>} 
                                {trade.direction}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${trade.status === 'won' ? 'bg-[#00C29A]/10 text-[#00C29A]' : 'bg-red-500/10 text-red-500'}`}>
                                {trade.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center bg-[#111] rounded-lg p-3 border border-[#222]">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-gray-500 uppercase">Amount / Entry</span>
                              <div className="font-bold text-white text-sm">{trade.amount} USDT</div>
                              <div className="text-xs text-gray-400">${trade.entry_price}</div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-gray-500 uppercase">Profit / Loss</span>
                              <div className={`font-bold text-sm ${trade.status === 'won' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                                {trade.status === 'won' ? '+' : '-'}{trade.status === 'won' ? (parseFloat(trade.amount) * (parseFloat(trade.profit_rate)/100)).toFixed(2) : parseFloat(trade.amount).toFixed(2)} USDT
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Bal: {trade.closing_balance ? `${parseFloat(trade.closing_balance).toFixed(2)}` : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="text-gray-500 text-xs border-b border-[#333]">
                          <th className="py-3 px-4 font-normal">Market</th>
                          <th className="py-3 px-4 font-normal">Direction</th>
                          <th className="py-3 px-4 font-normal">Entry</th>
                          <th className="py-3 px-4 font-normal">Amount</th>
                          <th className="py-3 px-4 font-normal">Profit/Loss</th>
                          <th className="py-3 px-4 font-normal">Result</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {tradeHistory.map(trade => (
                          <tr key={trade.id} className="border-b border-[#222] hover:bg-[#1a1a1a] transition-colors">
                            <td className="py-3 px-4 font-bold text-white">{trade.symbol}</td>
                            <td className="py-3 px-4">
                              <span className={`flex items-center gap-1 font-bold ${trade.direction === 'UP' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                                {trade.direction === 'UP' ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>} 
                                {trade.direction}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-white">${trade.entry_price}</td>
                            <td className="py-3 px-4 text-white">{trade.amount} USDT</td>
                            <td className="py-3 px-4">
                              <div className={`font-bold ${trade.status === 'won' ? 'text-[#00C29A]' : 'text-red-500'}`}>
                                {trade.status === 'won' ? '+' : '-'}{trade.status === 'won' ? (parseFloat(trade.amount) * (parseFloat(trade.profit_rate)/100)).toFixed(2) : parseFloat(trade.amount).toFixed(2)} USDT
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                Balance: {trade.closing_balance ? `${parseFloat(trade.closing_balance).toFixed(2)} USDT` : '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${trade.status === 'won' ? 'bg-[#00C29A]/10 text-[#00C29A]' : 'bg-red-500/10 text-red-500'}`}>
                                {trade.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-gray-500">No trade history for {symbol}</div>
                )
              )}
            </div>
          </div>

        </div>
      </main>

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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-[#00C29A]">Loading...</div>}>
      <OptionContent />
    </Suspense>
  );
}
