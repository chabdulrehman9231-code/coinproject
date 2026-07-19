'use client';
import { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance, submitWithdrawalRequest } from '@/app/dashboard/actions';

export default function WithdrawModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [activeNetwork, setActiveNetwork] = useState<string>('TRC20');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [availableBalance, setAvailableBalance] = useState(0);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setAddress('');
      setAmount('');
      setError('');
      fetchBalance();
    }
  }, [isOpen]);

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const res = await getUserBalance(user.id);
      if (res.success) {
        setAvailableBalance(res.balance);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (numAmount > availableBalance) {
      setError('Insufficient balance.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter a destination address.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const res = await submitWithdrawalRequest(user.id, numAmount, activeNetwork, address);

      if (!res.success) throw new Error(res.error);

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting the request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentAvailable = Math.max(0, availableBalance - (Number(amount) || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#222] rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#222]">
          <h2 className="font-bold text-lg text-white">Withdraw USDT</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1"><X className="w-5 h-5" /></button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#00C29A]/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00C29A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Requested</h3>
            <p className="text-sm text-gray-400 mb-6">Your withdrawal request is under review. The funds have been deducted from your balance.</p>
            <button onClick={onClose} className="w-full bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors">Close</button>
          </div>
        ) : (
          <div className="p-4 md:p-6">
            
            {/* Network Tabs */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 mb-2 uppercase tracking-wider">Select Network</label>
              <div className="flex gap-2">
                {['TRC20', 'ERC20'].map((net) => (
                  <button
                    key={net}
                    type="button"
                    onClick={() => setActiveNetwork(net)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors border ${
                      activeNetwork === net ? 'bg-[#BF953F]/10 text-[#BF953F] border-[#BF953F]/30' : 'bg-[#1a1a1a] text-gray-400 border-transparent hover:text-white hover:bg-[#222]'
                    }`}
                  >
                    {net}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 text-sm text-[#FF4444]">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Destination Address</label>
                <input 
                  type="text" 
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`Enter ${activeNetwork} wallet address`}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#BF953F] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Amount (USDT)</label>
                <input 
                  type="number" 
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimum 10 USDT"
                  min="0"
                  step="0.01"
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#BF953F] outline-none"
                />
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span className="text-gray-500">Available Balance:</span>
                  <span className="font-bold text-[#00C29A]">{currentAvailable.toFixed(2)} USDT</span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting || !amount || !address.trim() || Number(amount) > availableBalance || Number(amount) <= 0}
                className="w-full bg-[#FF4444] hover:bg-[#FF4444]/90 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4"
              >
                {isSubmitting ? 'Processing...' : 'Withdraw Request'}
              </button>
            </form>

          </div>
        )}
      </div>
    </div>
  );
}
