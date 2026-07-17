'use client';
import { useEffect, useRef } from 'react';

interface AdvancedTradingChartProps {
  symbol: string;
}

export default function AdvancedTradingChart({ symbol }: AdvancedTradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // The advanced widget needs a unique ID
    const containerId = `tv_chart_${Math.random().toString(36).substring(7)}`;
    containerRef.current.id = containerId;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    
    script.onload = () => {
      if (typeof window !== 'undefined' && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol.toUpperCase()}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          backgroundColor: "#0a0a0a", // Matches our app background
          gridColor: "#1a1a1a",
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          container_id: containerId,
          toolbar_bg: "#0a0a0a",
          studies: [
            "Volume@tv-basicstudies"
          ]
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div className="absolute inset-0 w-full h-full" ref={containerRef} />
  );
}
