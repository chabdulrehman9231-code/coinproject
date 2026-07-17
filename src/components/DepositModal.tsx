'use client';
import { useState, useEffect } from 'react';
import { X, Copy, UploadCloud, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { getAdminWallets } from '@/app/admin/actions';
import { submitDepositRequest } from '@/app/dashboard/actions';

interface Wallet {
  id: string;
  network_name: string;
  wallet_address: string;
  qr_code_url: string;
}

export default function DepositModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchWallets();
      setIsSuccess(false);
      setAmount('');
      setProofFile(null);
    }
  }, [isOpen]);

  const fetchWallets = async () => {
    const res = await getAdminWallets();
    if (res.success && res.data && res.data.length > 0) {
      setWallets(res.data);
      setActiveTab(res.data[0].id);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !proofFile || !activeTab) return;
    
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const activeWallet = wallets.find(w => w.id === activeTab);
      if (!activeWallet) throw new Error("No wallet selected");

      const formData = new FormData();
      formData.append('userId', user.id);
      formData.append('amount', amount);
      formData.append('targetWallet', activeWallet.network_name);
      formData.append('proofFile', proofFile);

      const res = await submitDepositRequest(formData);

      if (!res.success) throw new Error(res.error);

      setIsSuccess(true);
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111111] border border-[#222] rounded-2xl max-w-md w-full relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-[#222]">
          <h2 className="font-bold text-lg text-white">Deposit USDT</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1"><X className="w-5 h-5" /></button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#00C29A]/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#00C29A]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request Submitted</h3>
            <p className="text-sm text-gray-400 mb-6">Your deposit request is under review. The funds will reflect in your balance once approved by the admin.</p>
            <button onClick={onClose} className="w-full bg-[#333] hover:bg-[#444] text-white font-bold py-3 rounded-xl transition-colors">Close</button>
          </div>
        ) : (
          <div className="p-4 md:p-6">
            
            {/* Network Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-6 scrollbar-hide pb-2">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setActiveTab(w.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${
                    activeTab === w.id ? 'bg-[#0052FF]/10 text-[#0052FF] border-[#0052FF]/30' : 'bg-[#1a1a1a] text-gray-400 border-transparent hover:text-white hover:bg-[#222]'
                  }`}
                >
                  {w.network_name}
                </button>
              ))}
              {wallets.length === 0 && <span className="text-gray-500 text-sm">No networks available.</span>}
            </div>

            {wallets.length > 0 && activeTab && (
              <>
                {/* QR Code */}
                <div className="bg-white rounded-xl p-4 w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                  <QRCodeSVG 
                    value={wallets.find(w => w.id === activeTab)?.wallet_address || ''} 
                    size={160} 
                  />
                </div>

                {/* Address */}
                <div className="mb-6">
                  <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Deposit Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-sm text-gray-300 break-all">
                      {wallets.find(w => w.id === activeTab)?.wallet_address}
                    </div>
                    <button 
                      onClick={() => handleCopy(wallets.find(w => w.id === activeTab)?.wallet_address || '')}
                      className="p-3 bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/20 rounded-xl transition-colors shrink-0"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Amount Sent (USDT)</label>
                    <input 
                      type="number" 
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-3 text-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wider">Payment Proof</label>
                    <div className="relative border-2 border-dashed border-[#333] rounded-xl p-4 text-center hover:border-[#0052FF] transition-colors cursor-pointer bg-[#1a1a1a]">
                      <input 
                        type="file" 
                        accept="image/*" 
                        required
                        onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                        <UploadCloud className="w-6 h-6 text-[#0052FF]" />
                        <span className="text-sm font-medium">{proofFile ? proofFile.name : 'Upload Screenshot'}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || !proofFile || !amount}
                    className="w-full bg-[#0052FF] hover:bg-[#0052FF]/90 text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-2"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
                  </button>
                </form>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
