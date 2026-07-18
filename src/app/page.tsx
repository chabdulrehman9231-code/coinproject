'use client';
import { useRouter } from 'next/navigation';
import { Search, Globe, ChevronRight, Menu, Bell, Shield, Zap, LineChart } from 'lucide-react';
import { motion } from 'framer-motion';
import LiveCryptoCard from '@/components/LiveCryptoCard';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 bg-[#050505] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer" onClick={() => router.push('/')}>
            {/* New Coinbase 'C' Logo */}
            <svg className="w-7 h-7 md:w-8 md:h-8 shrink-0" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.776 13.333A16 16 0 1 0 31.776 18.667L20.618 18.667A5.333 5.333 0 1 1 20.618 13.333Z" fill="#0052FF"/>
            </svg>
            <span className="text-[17px] sm:text-xl md:text-2xl font-extrabold text-white tracking-tight whitespace-nowrap">CoinBase Trades</span>
          </div>
          <nav className="hidden lg:flex items-center gap-6 font-semibold text-[15px]">
            <a href="#" className="hover:text-blue-500 transition-colors">Explore</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Individuals</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Businesses</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Institutions</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Developers</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Company</a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="hidden sm:flex items-center gap-4 text-gray-300">
            <button className="hover:text-white transition-colors"><Search className="w-5 h-5" /></button>
            <button className="hover:text-white transition-colors"><Globe className="w-5 h-5" /></button>
          </div>
          <button 
            onClick={() => router.push('/login?mode=signup')}
            className="font-semibold text-[15px] hover:text-gray-300 transition-colors hidden sm:block"
          >
            Sign Up
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="bg-[#0052FF] hover:bg-[#0045d8] text-white px-5 py-2.5 rounded-full font-semibold text-[15px] transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>



      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column - Text */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 max-w-xl text-center lg:text-left"
        >
          <h1 className="text-5xl md:text-[64px] leading-[1.1] font-bold mb-6">
            Trade Crypto<br/><span className="text-[#0052FF]">Beyond Limits</span>
          </h1>
          <p className="text-[17px] md:text-[20px] text-gray-300 mb-8 leading-relaxed">
            Professional spot & contract trading, secure multi-network wallets, real-time charts, and 24/7 VIP support — all in one premium platform.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/login')}
            className="bg-[#0052FF] hover:bg-[#0045d8] text-white px-8 py-4 rounded-full font-bold text-[17px] w-full sm:w-auto transition-colors flex items-center justify-center gap-2 mx-auto lg:mx-0"
          >
            Start Trading <ChevronRight className="w-5 h-5" />
          </motion.button>
          
          {/* Compact Stats & Features */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-6 pt-5 border-t border-white/10 flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center gap-4 sm:gap-8 justify-center lg:justify-start">
              <div>
                <div className="text-lg md:text-xl font-bold text-white leading-tight">$4.2B+</div>
                <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Volume</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-white leading-tight">200K+</div>
                <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Active Users</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-white leading-tight">200+</div>
                <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Pairs</div>
              </div>
              <div>
                <div className="text-lg md:text-xl font-bold text-[#00C29A] leading-tight">99.9%</div>
                <div className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Uptime</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-3 mx-auto lg:mx-0 w-fit text-left mt-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#0052FF]/10 flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-[#0052FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[12px] font-bold text-gray-200 leading-none whitespace-nowrap overflow-hidden text-ellipsis">Bank-Grade Security</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">256-bit SSL</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#0052FF]/10 flex items-center justify-center shrink-0">
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-[#0052FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[12px] font-bold text-gray-200 leading-none whitespace-nowrap overflow-hidden text-ellipsis">Lightning Execution</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">&lt; 50ms Latency</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#0052FF]/10 flex items-center justify-center shrink-0">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-[#0052FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[12px] font-bold text-gray-200 leading-none whitespace-nowrap overflow-hidden text-ellipsis">Global Markets</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">200+ Pairs</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[#0052FF]/10 flex items-center justify-center shrink-0">
                  <LineChart className="w-3 h-3 sm:w-4 sm:h-4 text-[#0052FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[12px] font-bold text-gray-200 leading-none whitespace-nowrap overflow-hidden text-ellipsis">Advanced Charts</div>
                  <div className="text-[8px] sm:text-[10px] text-gray-500 leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">TradingView</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Column - Phone Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="flex-1 flex justify-center lg:justify-end w-full"
        >
          <div 
            className="relative bg-[#0052FF] p-[14px] rounded-[3rem] w-[380px] shadow-[0_30px_60px_rgba(0,82,255,0.4)] border-4 border-[#0052FF]/50"
          >
            {/* Phone Screen */}
            <div className="bg-white text-black h-[720px] w-full rounded-[2.2rem] overflow-hidden flex flex-col relative shadow-inner">
              
              {/* Dynamic Island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-7 bg-black rounded-full z-50 flex items-center justify-end px-2 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-gray-800" />
              </div>

              {/* Status Bar */}
              <div className="flex justify-between items-center px-6 pt-5 pb-2 text-[13px] font-semibold relative z-40">
                <span className="pl-2">9:41</span>
                <div className="flex gap-1.5 items-center">
                  <div className="w-4 h-3 bg-black mask-cellular rounded-sm" />
                  <div className="w-4 h-3 bg-black mask-wifi rounded-sm" />
                  <div className="w-[22px] h-[11px] border border-black rounded-[4px] p-[1px] relative flex">
                    <div className="bg-black h-full w-[80%] rounded-[2px]" />
                  </div>
                </div>
              </div>

              {/* App Header */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="flex justify-between items-center px-4 py-3 border-b border-gray-100 mt-2"
              >
                <Menu className="w-6 h-6 text-gray-700" />
                <div className="flex-1 mx-4 bg-gray-100/80 rounded-full flex items-center px-3 py-1.5 text-gray-500">
                  <Search className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Search</span>
                </div>
                <Bell className="w-5 h-5 text-gray-700" />
              </motion.div>

              {/* Balance */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                className="px-5 py-6"
              >
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-3xl font-extrabold tracking-tight">29,253.14 USDT</h2>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-gray-600 -rotate-90" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Thu, Jun 5, 2025</p>
              </motion.div>

              {/* Chart Mockup */}
              <div className="relative h-48 w-full mt-4">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0052FF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill Area */}
                  <motion.path 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
                    d="M0,100 L0,80 C 5,80 5,75 10,75 C 15,75 15,80 20,80 C 25,80 25,65 30,65 C 35,65 35,70 40,70 C 45,70 45,60 50,60 C 55,60 55,65 60,65 C 65,65 65,55 70,55 C 75,55 75,50 80,50 C 85,50 85,65 90,65 C 92.5,65 92.5,45 95,45 C 96.5,45 96.5,50 98,50 L98,100 Z" 
                    fill="url(#gradient)"
                  />
                  
                  {/* Chart Line */}
                  <motion.path 
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 1.5, ease: "easeInOut" }}
                    d="M0,80 C 5,80 5,75 10,75 C 15,75 15,80 20,80 C 25,80 25,65 30,65 C 35,65 35,70 40,70 C 45,70 45,60 50,60 C 55,60 55,65 60,65 C 65,65 65,55 70,55 C 75,55 75,50 80,50 C 85,50 85,65 90,65 C 92.5,65 92.5,45 95,45 C 96.5,45 96.5,50 98,50" 
                    fill="none" stroke="#0052FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </svg>

                {/* Current Price Dot Glow */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 2.5, opacity: 0 }} transition={{ delay: 2.3, repeat: Infinity, duration: 2 }}
                  className="absolute w-3 h-3 bg-[#0052FF] rounded-full"
                  style={{ left: '98%', top: '50%', transform: 'translate(-50%, -50%)' }}
                />
                
                {/* Current Price Dot Core */}
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 2.3 }}
                  className="absolute w-2.5 h-2.5 bg-[#0052FF] rounded-full shadow-[0_0_0_2px_white]"
                  style={{ left: '98%', top: '50%', transform: 'translate(-50%, -50%)' }}
                />

                {/* Dotted Line */}
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.4 }}
                  className="absolute right-[2%] top-[50%] bottom-0 border-r-2 border-dashed border-[#0052FF]/30" 
                />
              </div>

              {/* Time Tabs */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                className="flex justify-between px-6 py-4 text-xs font-bold text-gray-400 border-b border-gray-100 mt-2"
              >
                <span className="hover:text-gray-800 cursor-pointer transition-colors">1H</span>
                <span className="hover:text-gray-800 cursor-pointer transition-colors">1D</span>
                <span className="text-[#0052FF] bg-[#0052FF]/10 px-3 py-1 rounded-full">1W</span>
                <span className="hover:text-gray-800 cursor-pointer transition-colors">1M</span>
                <span className="hover:text-gray-800 cursor-pointer transition-colors">1Y</span>
                <span className="hover:text-gray-800 cursor-pointer transition-colors">ALL</span>
              </motion.div>

              {/* Asset List */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 }}
                className="flex flex-col mt-2 flex-1 overflow-y-auto"
              >
                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden">
                       <img src="https://assets.coincap.io/assets/icons/btc@2x.png" alt="BTC" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">BTC/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Bitcoin</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">52,431.20 USDT</span>
                      <span className="block text-xs font-bold text-green-500">+2.45%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden">
                       <img src="https://assets.coincap.io/assets/icons/eth@2x.png" alt="ETH" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">ETH/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Ethereum</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">2,840.50 USDT</span>
                      <span className="block text-xs font-bold text-green-500">+1.20%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden">
                       <img src="https://assets.coincap.io/assets/icons/doge@2x.png" alt="DOGE" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">DOGE/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Dogecoin</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">0.1254 USDT</span>
                      <span className="block text-xs font-bold text-red-500">-0.84%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </main>

      {/* Live Crypto Card Section */}
      <section className="max-w-[1200px] mx-auto px-6 pb-12 md:pb-24">
        <LiveCryptoCard />
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/10 pt-16 pb-8">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
            {/* Logo and Brand */}
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M31.776 13.333A16 16 0 1 0 31.776 18.667L20.618 18.667A5.333 5.333 0 1 1 20.618 13.333Z" fill="#0052FF"/>
                </svg>
                <span className="text-xl font-extrabold tracking-tight text-white">CoinBase Trades</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The most trusted crypto platform. Professional spot & contract trading, secure multi-network wallets, real-time charts, and 24/7 VIP support.
              </p>
              <div className="flex items-center gap-4 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>

              </div>
            </div>

            {/* Products */}
            <div>
              <h3 className="text-white font-semibold mb-4">Products</h3>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white hover:underline transition-all">Exchange</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Wallet</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Earn</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Institutional</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Card</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white hover:underline transition-all">About Us</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Careers</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Affiliates</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Blog</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Press</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white hover:underline transition-all">Help Center</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Fees</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">API Documentation</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Trading Rules</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="flex flex-col gap-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white hover:underline transition-all">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Risk Warning</a></li>
                <li><a href="#" className="hover:text-white hover:underline transition-all">Law Enforcement</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-gray-500 text-xs gap-4">
            <p>© {new Date().getFullYear()} CoinBase Trades. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> English (US)</span>
              <a href="#" className="hover:text-white transition-colors">USD - $</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
