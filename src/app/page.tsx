'use client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';


export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden font-sans">

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 md:px-12 md:py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer">
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 8L8 36H40L24 8Z" fill="#0066FF" opacity="0.8"/>
            <path d="M24 16L14 36H34L24 16Z" fill="#00C29A" opacity="0.9"/>
          </svg>
          <span className="text-xl font-extrabold tracking-tight text-white">Coinbase Trrades</span>
        </div>
        <div>
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors font-semibold text-sm"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-20 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center max-w-7xl mx-auto">

        {/* Text Content */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl relative z-30"
        >
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 font-semibold text-xs tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(0,102,255,0.3)]">
            Next Generation Trading
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-tight mb-6">
            Trade Crypto <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0066FF] to-[#00C29A]">
              Seamlessly
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience lightning-fast execution, zero hidden fees, and premium animated interfaces. 
            Step into the future of digital assets with Coinbase Trrades.
          </p>
          
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 102, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/login')}
            className="px-10 py-4 bg-[#0066FF] text-white rounded-full font-bold text-lg shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-shadow"
          >
            Start Trading
          </motion.button>
        </motion.div>
      </main>

      {/* Decorative Bottom Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#0066FF]/20 to-transparent pointer-events-none z-10" />
    </div>
  );
}
