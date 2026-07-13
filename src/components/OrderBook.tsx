'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface OrderBookProps {
  symbol?: string;
}

export default function OrderBook({ symbol = 'BTCUSDT' }: OrderBookProps) {
  const [bids, setBids] = useState<[string, string][]>([]);
  const [asks, setAsks] = useState<[string, string][]>([]);
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');

  useEffect(() => {
    // Connect to Depth Stream (Order Book)
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth10@100ms`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.bids && data.asks) {
        setBids(data.bids.slice(0, 10)); // Keep top 10
        setAsks(data.asks.slice(0, 10).reverse()); // Keep top 10, reverse so lowest ask is at bottom
      }
    };
    
    // Connect to Trade stream for current price
    const priceWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    priceWs.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setCurrentPrice(parseFloat(data.p).toFixed(2));
    }

    return () => {
      ws.close();
      priceWs.close();
    };
  }, [symbol]);

  return (
    <div className="w-[320px] hidden xl:flex flex-col bg-background border-l border-border">
      {/* Order Book Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-sm font-medium">Order Book</span>
        <div className="flex gap-2">
           <button className="text-muted hover:text-foreground">
             <ArrowUp className="h-4 w-4 text-buy" />
           </button>
           <button className="text-muted hover:text-foreground">
             <ArrowDown className="h-4 w-4 text-sell" />
           </button>
        </div>
      </div>
      
      {/* Order Book Data */}
      <div className="flex-1 flex flex-col p-2 text-xs font-mono overflow-hidden">
        <div className="flex justify-between text-muted mb-2 px-1">
          <span>Price(USDT)</span>
          <span>Amount(BTC)</span>
          <span>Total</span>
        </div>
        
        {/* Asks (Sells) - Red */}
        <div className="flex flex-col justify-end gap-1 flex-1">
          {asks.map((ask, i) => {
            const price = parseFloat(ask[0]).toFixed(2);
            const amount = parseFloat(ask[1]).toFixed(4);
            const total = (parseFloat(ask[0]) * parseFloat(ask[1])).toFixed(2);
            const depth = Math.min(100, (parseFloat(ask[1]) * 10)); // fake depth visual
            
            return (
            <div key={`ask-${i}`} className="flex justify-between px-1 hover:bg-panel cursor-pointer relative">
              <div className="absolute right-0 top-0 bottom-0 bg-sell/10" style={{width: `${depth}%`}}></div>
              <span className="text-sell relative z-10">{price}</span>
              <span className="text-foreground relative z-10">{amount}</span>
              <span className="text-foreground relative z-10">{total}</span>
            </div>
            )
          })}
        </div>
        
        {/* Current Price */}
        <div className="py-2 flex items-center justify-between border-y border-border my-1 px-1">
          <span className="text-lg font-bold text-buy">{currentPrice}</span>
          <span className="text-sm text-muted underline">${currentPrice}</span>
        </div>
        
        {/* Bids (Buys) - Green */}
        <div className="flex flex-col gap-1 flex-1">
          {bids.map((bid, i) => {
            const price = parseFloat(bid[0]).toFixed(2);
            const amount = parseFloat(bid[1]).toFixed(4);
            const total = (parseFloat(bid[0]) * parseFloat(bid[1])).toFixed(2);
            const depth = Math.min(100, (parseFloat(bid[1]) * 10)); // fake depth visual
            
            return (
            <div key={`bid-${i}`} className="flex justify-between px-1 hover:bg-panel cursor-pointer relative">
              <div className="absolute right-0 top-0 bottom-0 bg-buy/10" style={{width: `${depth}%`}}></div>
              <span className="text-buy relative z-10">{price}</span>
              <span className="text-foreground relative z-10">{amount}</span>
              <span className="text-foreground relative z-10">{total}</span>
            </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
