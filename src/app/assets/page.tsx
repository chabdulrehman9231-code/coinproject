'use client';
import { useState, useEffect } from 'react';
import { Download, Upload, Maximize2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState('currency');
  const [balance, setBalance] = useState('0.0000');
  const [uid, setUid] = useState('GOKLADQT'); // Mock default, could be derived from user ID later

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Just take the first 8 chars of their UUID as a mock UID for display
        setUid(user.id.split('-')[0].toUpperCase());
        
        supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('asset', 'USDT')
          .single()
          .then(({ data }) => {
            if (data) {
              setBalance(Number(data.balance).toFixed(4));
            }
          });
      }
    });
  }, [supabase]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-center px-4 py-4 shrink-0">
        <h1 className="text-xl font-bold">Assets</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        
        {/* Tabs */}
        <div className="flex px-4 border-b border-[#1a1a1a] text-sm font-medium">
          <button 
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'currency' ? 'text-white border-b-2 border-[#0066FF]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('currency')}
          >
            Currency Account
          </button>
          <button 
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'contract' ? 'text-white border-b-2 border-[#0066FF]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('contract')}
          >
            Contract Account
          </button>
          <button 
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'options' ? 'text-white border-b-2 border-[#0066FF]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('options')}
          >
            Options Account
          </button>
        </div>

        {/* Total Assets Summary */}
        <div className="px-5 py-6">
          <div className="text-gray-400 text-sm mb-1">Total Assets(USDT)</div>
          <div className="text-4xl font-extrabold tracking-tight">{balance}</div>
          <div className="text-gray-500 text-sm mt-1">≈{balance} USD</div>
          <div className="text-[#0066FF] text-sm font-bold mt-4 tracking-wider">UID: {uid}</div>
        </div>

        {/* Asset Valuations Card */}
        <div className="mx-4 bg-[#161616] rounded-2xl p-5 shadow-lg border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <div className="text-gray-400 text-[13px]">Asset valuations (USDT)</div>
            <div className="bg-[#0066FF] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Currency</div>
          </div>
          <div className="text-[#0066FF] text-3xl font-extrabold">{balance}</div>
          <div className="text-gray-500 text-[13px] mt-1">Available</div>

          <div className="grid grid-cols-3 gap-4 mt-6 border-t border-[#222] pt-6">
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-[#222] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors border border-transparent group-hover:border-[#0066FF]/30">
                <Download className="w-5 h-5 text-[#0066FF]" />
              </div>
              <span className="text-xs font-bold">Deposit</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-[#222] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors border border-transparent group-hover:border-[#0066FF]/30">
                <Upload className="w-5 h-5 text-[#0066FF]" />
              </div>
              <span className="text-xs font-bold">Withdraw</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-xl bg-[#222] flex items-center justify-center group-hover:bg-[#2a2a2a] transition-colors border border-transparent group-hover:border-[#0066FF]/30">
                <Maximize2 className="w-5 h-5 text-[#0066FF]" />
              </div>
              <span className="text-xs font-bold">Transfer</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-600 text-sm">No balances in this account.</p>
        </div>

      </main>

      <BottomNav />
    </div>
  );
}
