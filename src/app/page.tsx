'use client';
import { useRouter } from 'next/navigation';
import { Search, Globe, ChevronRight, Menu, Bell } from 'lucide-react';

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

      {/* Risk Warning Banner */}
      <div className="w-full bg-[#111] border-b border-[#222] py-2.5 px-4 text-center text-xs text-gray-400">
        Don't invest unless you're prepared to lose all the money you invest. This is a high-risk investment and you should not expect to be protected if something goes wrong. <a href="#" className="underline hover:text-white">Take 2 mins to learn more</a>
      </div>

      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 py-12 md:py-24 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Column - Text */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <h1 className="text-5xl md:text-[64px] leading-[1.1] font-bold mb-6">
            The most trusted<br/>crypto trading app
          </h1>
          <p className="text-[17px] md:text-[20px] text-gray-300 mb-6 leading-relaxed">
            Coinbase is the most trusted platform in the UK for buying, selling and trading crypto.
          </p>
          <p className="text-[15px] text-gray-400 mb-8 font-medium">
            Deposit GBP into your account for free to get started today
          </p>
          <button 
            onClick={() => router.push('/login')}
            className="bg-[#0052FF] hover:bg-[#0045d8] text-white px-8 py-4 rounded-full font-bold text-[17px] w-full sm:w-auto transition-colors"
          >
            Sign up
          </button>
        </div>

        {/* Right Column - Phone Mockup */}
        <div className="flex-1 flex justify-center lg:justify-end w-full">
          <div className="relative bg-[#0052FF] p-6 rounded-[2.5rem] w-[340px] shadow-2xl">
            {/* Phone Screen */}
            <div className="bg-white text-black h-[680px] w-full rounded-[2rem] overflow-hidden flex flex-col relative shadow-inner">
              
              {/* Status Bar */}
              <div className="flex justify-between items-center px-6 pt-4 pb-2 text-[13px] font-semibold">
                <span>9:41</span>
                <div className="flex gap-1.5 items-center">
                  <div className="w-4 h-3 bg-black mask-cellular rounded-sm" />
                  <div className="w-4 h-3 bg-black mask-wifi rounded-sm" />
                  <div className="w-6 h-3 border border-black rounded-[4px] p-[1px] relative">
                    <div className="bg-black h-full w-[80%] rounded-[2px]" />
                  </div>
                </div>
              </div>

              {/* App Header */}
              <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
                <Menu className="w-6 h-6 text-gray-700" />
                <div className="flex-1 mx-4 bg-gray-100 rounded-full flex items-center px-3 py-1.5 text-gray-500">
                  <Search className="w-4 h-4 mr-2" />
                  <span className="text-sm">Search</span>
                </div>
                <Bell className="w-5 h-5 text-gray-700" />
              </div>

              {/* Balance */}
              <div className="px-5 py-6">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-3xl font-bold">£29,253.14</h2>
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 text-gray-600 -rotate-90" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Thu, Jun 5, 2025</p>
              </div>

              {/* Chart Mockup */}
              <div className="relative h-48 w-full mt-4">
                {/* Simulated Chart Line */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0052FF" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#0052FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M0,80 L10,75 L20,80 L30,65 L40,70 L50,60 L60,65 L70,55 L80,50 L90,65 L95,45 L100,50" 
                    fill="none" stroke="#0052FF" strokeWidth="1.5"
                  />
                  <path 
                    d="M0,100 L0,80 L10,75 L20,80 L30,65 L40,70 L50,60 L60,65 L70,55 L80,50 L90,65 L95,45 L100,50 L100,100 Z" 
                    fill="url(#gradient)"
                  />
                  {/* Current Price Dot */}
                  <circle cx="95" cy="45" r="3" fill="#0052FF" />
                </svg>
                {/* Dotted Line */}
                <div className="absolute right-[5%] top-[45%] bottom-0 border-r border-dashed border-[#0052FF]" />
              </div>

              {/* Time Tabs */}
              <div className="flex justify-between px-6 py-4 text-xs font-semibold text-gray-400 border-b border-gray-100">
                <span>1H</span>
                <span>1D</span>
                <span className="text-[#0052FF] bg-blue-50 px-2 py-1 rounded-full">1W</span>
                <span>1M</span>
                <span>1Y</span>
                <span>ALL</span>
              </div>

              {/* Asset List */}
              <div className="flex flex-col mt-2">
                <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
                       <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-700">
                         <path d="M4 12a8 8 0 1116 0 8 8 0 01-16 0zM12 8v8M9 12h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                       </svg>
                    </div>
                    <span className="font-bold">Crypto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">£12,370.00</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50">
                       <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-gray-700">
                         <path d="M12 4v16M8 8l4-4 4 4M8 16l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                       </svg>
                    </div>
                    <span className="font-bold">Cash</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">£18,165.80</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-500">
        Based on results of <a href="#" className="underline hover:text-gray-300">2025 International YouGov Brand Research &gt;</a>
      </footer>

    </div>
  );
}
