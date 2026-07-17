'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getUserTransactions } from '@/app/dashboard/actions';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getUserTransactions(user.id).then(res => {
          if (res.success) {
            setTransactions(res.data);
          }
          setIsLoading(false);
        });
      } else {
        router.push('/login');
      }
    });
  }, [supabase, router]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-[#00C29A]';
      case 'rejected': return 'text-[#FF4444]';
      case 'reversed': return 'text-[#FF4444]';
      case 'pending': return 'text-amber-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-[#00C29A]" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-[#FF4444]" />;
      case 'reversed': return <XCircle className="w-4 h-4 text-[#FF4444]" />;
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-4 shrink-0 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Transaction History</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl mx-auto w-full pt-4 md:pt-8 px-4">
          
          <div className="hidden md:flex items-center gap-3 mb-6">
             <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
               <ArrowLeft className="w-6 h-6" />
             </button>
             <h2 className="text-2xl font-bold">Transaction History</h2>
          </div>

          <div className="bg-[#111] rounded-3xl p-4 md:p-8 shadow-xl border border-[#222]">
            {isLoading ? (
              <div className="text-center py-10 text-gray-400">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-300 mb-1">No Transactions Yet</h3>
                <p className="text-sm text-gray-500">Your deposit and withdrawal history will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 sm:p-4 bg-[#161616] border border-[#222] hover:border-[#333] transition-colors rounded-2xl gap-2 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'deposit' ? 'bg-[#0052FF]/10' : 'bg-[#FF4444]/10'}`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownLeft className="w-5 h-5 sm:w-6 sm:h-6 text-[#0052FF]" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF4444]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm sm:text-base text-white uppercase truncate">{tx.type}</div>
                        <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{new Date(tx.created_at).toLocaleString()}</div>
                        {tx.type === 'withdrawal' && tx.proof_image_url && (
                          <div className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">
                            To: <span className="text-[#0052FF]">{tx.proof_image_url}</span> ({tx.target_wallet})
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0">
                      <div className={`font-bold text-sm sm:text-lg whitespace-nowrap ${tx.type === 'deposit' ? 'text-white' : 'text-white'}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{Number(tx.amount).toFixed(2)} <span className="text-xs sm:text-sm text-gray-300">USDT</span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                        {getStatusIcon(tx.status)}
                        <span className={`text-[9px] sm:text-xs font-bold uppercase ${getStatusColor(tx.status)}`}>{tx.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
