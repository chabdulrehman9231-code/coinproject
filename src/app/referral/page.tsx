'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Check, Crown, Users, DollarSign, Share2 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getReferralData } from '@/app/dashboard/actions';

export default function ReferralPage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        getReferralData(user.id).then(res => {
          if (res.success) {
            setReferralCode(res.referralCode);
            setTotalReferrals(res.totalReferrals);
            setTotalEarned(res.totalEarned);
          }
          setLoading(false);
        });
      } else {
        router.push('/login');
      }
    });
  }, [supabase, router]);

  const handleCopyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!referralCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const referralLink = `${origin}/login?mode=signup&ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto w-full pt-4 md:pt-8 px-4">
          
          {/* Header section with back button */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => router.back()} 
              className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">Referral Program</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-[#0052FF] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Loading referral stats...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Referrals */}
                <div className="bg-[#111] rounded-2xl p-5 border border-[#222] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-[#0052FF]/10 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-[#0052FF]" />
                  </div>
                  <div className="text-3xl font-extrabold text-white mb-1">
                    {totalReferrals}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Total Referrals
                  </div>
                </div>

                {/* Total Earned */}
                <div className="bg-[#111] rounded-2xl p-5 border border-[#222] flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-[#00C29A]/10 flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5 text-[#00C29A]" />
                  </div>
                  <div className="text-3xl font-extrabold text-[#00C29A] mb-1">
                    {totalEarned.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    Earned (USDT)
                  </div>
                </div>
              </div>

              {/* Invite Code Card */}
              <div className="bg-[#111] rounded-3xl p-6 border border-[#222] shadow-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#0052FF]/30 to-transparent" />
                
                <div className="text-sm font-semibold text-[#0052FF] mb-4 uppercase tracking-wider">
                  My Invite Code
                </div>
                
                <div className="text-4xl font-black text-white tracking-wider mb-2 font-mono">
                  {referralCode || '------'}
                </div>
                
                <button 
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 mb-6"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#00C29A]" />
                      <span className="text-[#00C29A]">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={handleCopyLink}
                  className="w-full py-3.5 rounded-xl border border-[#0052FF] text-[#0052FF] hover:bg-[#0052FF]/10 active:scale-[0.98] transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-[#00C29A]" />
                      <span className="text-[#00C29A]">Referral Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Copy Referral Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Partner Benefits Card */}
              <div className="bg-[#111] rounded-3xl p-6 border border-[#222] shadow-xl">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <h3 className="text-base font-bold text-white">Partner Benefits</h3>
                </div>

                <ul className="flex flex-col gap-4 text-sm text-gray-400">
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-2 shrink-0" />
                    <span>Earn <strong className="text-white font-semibold">5% commission</strong> on your referrals' approved deposits.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-2 shrink-0" />
                    <span>Enjoy lifetime referral tracking on all referred accounts.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0052FF] mt-2 shrink-0" />
                    <span>Commissions are calculated and credited automatically upon deposit approval.</span>
                  </li>
                </ul>
              </div>

            </div>
          )}
          
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
