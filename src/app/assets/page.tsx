'use client';
import { useState, useEffect } from 'react';
import { Download, Upload, Wallet } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import WithdrawModal from '@/components/WithdrawModal';
import DepositModal from '@/components/DepositModal';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';

export default function AssetsPage() {
  const [balance, setBalance] = useState<number | string>(0);
  const [uid, setUid] = useState('N/A');
  const [vipLevel, setVipLevel] = useState('Bronze');
  const [creditScore, setCreditScore] = useState(700);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUid(user.id.split('-')[0].toUpperCase());
      const res = await getUserBalance(user.id);
      if (res.success) {
        setBalance(Number(res.balance).toFixed(2));
        setVipLevel(res.vipLevel || 'Bronze');
        setCreditScore(res.creditScore ?? 700);
      }
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [supabase]);

  // Determine VIP color
  let vipColor = 'text-amber-500';
  if (vipLevel === 'Silver') vipColor = 'text-gray-300';
  if (vipLevel === 'Gold') vipColor = 'text-yellow-400';
  if (vipLevel === 'Diamond') vipColor = 'text-cyan-400';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#000000] text-white font-sans">
      <Header />
      
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-center px-4 py-4 shrink-0">
        <h1 className="text-xl font-bold">Assets</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto w-full pt-4 px-4">
          
          {/* Centered Balance Card */}
          <div className="bg-[#111] rounded-3xl p-8 shadow-xl border border-[#222] flex flex-col items-center text-center">
            
            {/* Wallet Icon */}
            <div className="w-14 h-14 rounded-2xl bg-[#BF953F]/10 flex items-center justify-center mb-4 border border-[#BF953F]/20">
              <Wallet className="w-6 h-6 text-[#BF953F]" />
            </div>

            {/* Title & Balance */}
            <div className="text-gray-400 text-sm mb-2">Total Portfolio Value</div>
            <div className="text-white text-5xl font-extrabold tracking-tight mb-8">
              {balance} <span className="text-2xl text-gray-500 font-bold ml-1">USDT</span>
            </div>

            {/* Info Boxes */}
            <div className="flex justify-center gap-2 md:gap-4 mb-8 w-full max-w-lg">
              <div className="flex-1 bg-[#161616] border border-[#222] rounded-2xl py-3 px-2 flex flex-col items-center">
                <span className="text-gray-500 text-[11px] mb-1 uppercase">UID</span>
                <span className="text-white text-xs font-bold tracking-wider">{uid}</span>
              </div>
              <div className="flex-1 bg-[#161616] border border-[#222] rounded-2xl py-3 px-2 flex flex-col items-center">
                <span className="text-gray-500 text-[11px] mb-1 uppercase">VIP Level</span>
                <span className={`text-xs font-bold uppercase ${vipColor}`}>{vipLevel}</span>
              </div>
              <div className="flex-1 bg-[#161616] border border-[#222] rounded-2xl py-3 px-2 flex flex-col items-center">
                <span className="text-gray-500 text-[11px] mb-1 uppercase">Credit Score</span>
                <span className="text-[#00C29A] text-xs font-bold">{creditScore}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 w-full max-w-lg">
              <button 
                onClick={() => setIsDepositModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-[#BF953F] hover:bg-[#BF953F]/90 text-white px-4 py-3 rounded-xl font-semibold transition-colors"
              >
                <Download className="w-5 h-5" /> Deposit
              </button>
              <button onClick={() => setIsWithdrawModalOpen(true)} className="flex-1 flex items-center justify-center gap-2 bg-[#FF4444] hover:bg-[#FF4444]/90 text-white px-4 py-3 rounded-xl font-semibold transition-colors">
                <Upload className="w-5 h-5" /> Withdraw
              </button>
            </div>

          </div>
        </div>
      </main>

      <BottomNav />
      
      <WithdrawModal 
        isOpen={isWithdrawModalOpen} 
        onClose={() => {
          setIsWithdrawModalOpen(false);
          fetchBalance();
        }} 
      />

      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => {
          setIsDepositModalOpen(false);
          fetchBalance();
        }}
      />
    </div>
  );
}
