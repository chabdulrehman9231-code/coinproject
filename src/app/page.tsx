'use client';
import { useRouter } from 'next/navigation';
import { Search, Globe, ChevronRight, Menu, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 md:px-12 bg-[#050505] border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
            {/* New Coinbase 'C' Logo */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm0-10.667c2.946 0 5.333-2.387 5.333-5.333S18.946 10.667 16 10.667 10.667 13.054 10.667 16s2.387 5.333 5.333 5.333z" fill="#0052FF"/>
            </svg>
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
            onClick={() => router.push('/login')}
            className="font-semibold text-[15px] hover:text-gray-300 transition-colors hidden sm:block"
          >
            Sign In
          </button>
          <button 
            onClick={() => router.push('/login')}
            className="bg-[#0052FF] hover:bg-[#0045d8] text-white px-5 py-2.5 rounded-full font-semibold text-[15px] transition-colors"
          >
            Sign up
          </button>
          <button className="lg:hidden text-white">
            <Menu className="w-6 h-6" />
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
                  <h2 className="text-3xl font-extrabold tracking-tight">£29,253.14</h2>
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
                       <img src="https://assets.coincap.io/assets/icons/btc@2x.png" alt="BTC" className="w-6 h-6 object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">BTC/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Bitcoin</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">£52,431.20</span>
                      <span className="block text-xs font-bold text-green-500">+2.45%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden">
                       <img src="https://assets.coincap.io/assets/icons/eth@2x.png" alt="ETH" className="w-6 h-6 object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">ETH/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Ethereum</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">£2,840.50</span>
                      <span className="block text-xs font-bold text-green-500">+1.20%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden">
                       <img src="https://assets.coincap.io/assets/icons/doge@2x.png" alt="DOGE" className="w-6 h-6 object-cover" />
                    </div>
                    <div>
                      <span className="block font-extrabold text-[15px] leading-tight">DOGE/USDT</span>
                      <span className="block text-xs font-medium text-gray-500">Dogecoin</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="block font-bold text-[15px] leading-tight">£0.1254</span>
                      <span className="block text-xs font-bold text-red-500">-0.84%</span>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-500">
        Based on results of <a href="#" className="underline hover:text-gray-300">2025 International YouGov Brand Research &gt;</a>
      </footer>

    </div>
  );
}
