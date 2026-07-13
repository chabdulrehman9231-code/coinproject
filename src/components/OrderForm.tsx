'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OrderForm({ symbol = 'BTCUSDT' }: { symbol?: string }) {
  const baseAsset = symbol.replace('USDT', '');
  
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');
  const [usdtBalance, setUsdtBalance] = useState<number>(0);
  const [baseBalance, setBaseBalance] = useState<number>(0);
  const [buyAmount, setBuyAmount] = useState<string>('');
  const [sellAmount, setSellAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  
  const fetchBalances = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setUsdtBalance(0);
      setBaseBalance(0);
      return;
    }
    
    const { data } = await supabase.from('wallets').select('*').eq('user_id', user.id);
    if (data) {
      const usdt = data.find(w => w.asset === 'USDT')?.balance || 0;
      const base = data.find(w => w.asset === baseAsset)?.balance || 0;
      setUsdtBalance(Number(usdt));
      setBaseBalance(Number(base));
    }
  };

  useEffect(() => {
    fetchBalances();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchBalances();
    });
    
    // Live Price WebSocket
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentPrice(parseFloat(data.p).toFixed(2));
    };

    return () => {
      subscription.unsubscribe();
      ws.close();
    };
  }, [symbol, baseAsset]);

  const handleTrade = async (side: 'BUY' | 'SELL') => {
    const amount = side === 'BUY' ? buyAmount : sellAmount;
    if (!amount || Number(amount) <= 0) return alert('Enter a valid amount');
    setLoading(true);
    
    const qty = Number(amount);
    const price = Number(currentPrice);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to trade!");
      
      if (side === 'BUY' && usdtBalance < qty) throw new Error("Insufficient USDT balance");
      if (side === 'SELL' && baseBalance < qty) throw new Error(`Insufficient ${baseAsset} balance`);
      
      // Calculate how much base asset to give on BUY, or how much USDT to give on SELL
      // If side === BUY, qty is in USDT. So baseAsset amount = qty / price.
      // Wait, standard exchanges: "Buy amount" is usually base asset.
      // But in screenshot: "Buy (USDT)" -> "0.00 USDT". This implies user enters USDT amount to spend!
      // So if side === 'BUY', user spends `qty` USDT, receives `qty / price` BaseAsset.
      // If side === 'SELL', user spends `qty` BaseAsset, receives `qty * price` USDT.
      
      const tradeQty = side === 'BUY' ? (qty / price) : qty;
      
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ side, symbol, amount: tradeQty, price })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Trade failed");
      
      alert(`Successfully ${side === 'BUY' ? 'bought' : 'sold'} ${baseAsset}!`);
      if (side === 'BUY') setBuyAmount('');
      else setSellAmount('');
      
      fetchBalances();
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex px-4 py-4 gap-4 w-full">
      {/* Buy Form */}
      <div className="flex-1 flex flex-col gap-2 h-full">
        <div className="flex justify-between items-center px-1">
          <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">Buy (USDT)</span>
          <span className="text-[12px] text-gray-500 whitespace-nowrap truncate ml-2">Avail: {usdtBalance.toFixed(2)}</span>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-xl flex items-center px-3 py-3 border border-transparent focus-within:border-[#0066FF]/30 transition-colors">
          <input 
            type="number" 
            value={buyAmount}
            onChange={e => setBuyAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent w-full outline-none text-white text-[15px]"
          />
          <span className="text-gray-500 text-[13px] ml-2">USDT</span>
        </div>
        
        <button 
          disabled={loading}
          onClick={() => handleTrade('BUY')}
          className="bg-[#00C29A] hover:bg-[#00C29A]/90 text-black font-bold py-3.5 rounded-xl mt-auto disabled:opacity-50 transition-colors text-[15px]"
        >
          {loading ? 'Processing...' : `Buy ${baseAsset}`}
        </button>
      </div>
      
      {/* Sell Form */}
      <div className="flex-1 flex flex-col gap-2 h-full">
        <div className="flex justify-between items-center px-1">
          <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap">Sell ({baseAsset})</span>
          <span className="text-[12px] text-gray-500 whitespace-nowrap truncate ml-2">Avail: {baseBalance.toFixed(6)}</span>
        </div>
        
        <div className="bg-[#1a1a1a] rounded-xl flex items-center px-3 py-3 border border-transparent focus-within:border-[#ff5f6e]/30 transition-colors">
          <input 
            type="number" 
            value={sellAmount}
            onChange={e => setSellAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent w-full outline-none text-white text-[15px]"
          />
        </div>
        
        <button 
          disabled={loading}
          onClick={() => handleTrade('SELL')}
          className="bg-[#ff5f6e] hover:bg-[#ff5f6e]/90 text-white font-bold py-3.5 rounded-xl mt-auto disabled:opacity-50 transition-colors text-[15px]"
        >
          {loading ? 'Processing...' : `Sell ${baseAsset}`}
        </button>
      </div>
    </div>
  );
}
