'use client';
import { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, CandlestickSeries } from 'lightweight-charts';

export default function TradingChart({ symbol = 'BTCUSDT', interval = '1m' }: { symbol?: string, interval?: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. Create Chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0a0a0a' },
        textColor: '#848E9C',
      },
      grid: {
        vertLines: { color: 'transparent', visible: false },
        horzLines: { color: 'transparent', visible: false },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#2B3139',
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: { color: '#848E9C', style: 3, labelBackgroundColor: '#1E2329' },
        horzLine: { color: '#848E9C', style: 3, labelBackgroundColor: '#1E2329' },
      }
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00C29A',
      downColor: '#ff5f6e',
      borderVisible: false,
      wickUpColor: '#00C29A',
      wickDownColor: '#ff5f6e',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // 2. Fetch Initial Historical Data (dynamic interval)
    fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=200`)
      .then(res => res.json())
      .then(data => {
        const formattedData = data.map((d: any) => ({
          time: d[0] / 1000,
          open: parseFloat(d[1]),
          high: parseFloat(d[2]),
          low: parseFloat(d[3]),
          close: parseFloat(d[4]),
        }));
        candlestickSeries.setData(formattedData);
      })
      .catch(err => console.error("Error fetching historical data:", err));

    // 3. Connect to Binance WebSocket for Live Ticks
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const kline = message.k;
      
      const tick = {
        time: kline.t / 1000,
        open: parseFloat(kline.o),
        high: parseFloat(kline.h),
        low: parseFloat(kline.l),
        close: parseFloat(kline.c),
      };
      
      candlestickSeries.update(tick as any);
    };
    wsRef.current = ws;

    // 4. Handle Resize using ResizeObserver for perfect flex container fitting
    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ 
        width: newRect.width,
        height: newRect.height
      });
    });
    
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (wsRef.current) wsRef.current.close();
      chart.remove();
    };
  }, [symbol, interval]);

  return (
    <div className="w-full h-full relative overflow-hidden" ref={chartContainerRef}>
    </div>
  );
}
