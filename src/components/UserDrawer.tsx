'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance } from '@/app/dashboard/actions';
import { 
  User, Copy, Download, Upload, FileText, 
  Shield, LogOut, ChevronRight, X, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDrawer({ isOpen, onClose }: UserDrawerProps) {
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [vipLevel, setVipLevel] = useState('Bronze');
  const [creditScore, setCreditScore] = useState(700);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        setUid(user.id.split('-')[0].toUpperCase());
        
        const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
        if (data?.role === 'superadmin') {
          setIsAdmin(true);
        }
        getUserBalance(user.id).then(res => {
          if (res.success) {
            setVipLevel(res.vipLevel || 'Bronze');
            setCreditScore(res.creditScore ?? 700);
          }
        });
      }
    });
  }, [supabase]);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(uid);
    // Could add a toast here
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    ...(isAdmin ? [{ icon: ShieldAlert, label: 'Admin Panel', action: () => router.push('/admin') }] : []),
    { icon: Download, label: 'Deposit', action: () => router.push('/assets') },
    { icon: Upload, label: 'Withdraw', action: () => router.push('/assets') },
    { icon: FileText, label: 'Transaction History', action: () => router.push('/transactions') },
    { icon: Shield, label: 'Security Center', action: () => router.push('/security') },
  ];

  let vipColor = 'text-amber-500';
  if (vipLevel === 'Silver') vipColor = 'text-gray-300';
  if (vipLevel === 'Gold') vipColor = 'text-yellow-400';
  if (vipLevel === 'Diamond') vipColor = 'text-cyan-400';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-[100] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#111] z-[101] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto pb-6 scrollbar-hide">
              {/* Header Profile Info */}
              <div className="p-6 bg-[#161616] border-b border-[#222]">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-4 mt-2">
                  <div className="w-16 h-16 rounded-full bg-[#0052FF] flex items-center justify-center shrink-0">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className={`px-2 py-0.5 bg-[#222] border border-[#333] rounded text-[10px] font-bold uppercase w-max tracking-wider ${vipColor}`}>
                      VIP: {vipLevel}
                    </div>
                    <div className="px-2 py-0.5 bg-[#222] border border-[#333] rounded text-[10px] font-bold text-[#00C29A] uppercase w-max tracking-wider">
                      Credit: {creditScore}
                    </div>
                  </div>
                </div>
                <h2 className="text-lg font-bold text-white mb-1 truncate">
                  {email || 'User'}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>UID: {uid}</span>
                  <button onClick={handleCopyUid} className="text-[#0052FF] hover:text-[#3385ff] p-1">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Menu Links */}
              <div className="py-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={index}
                      onClick={() => {
                        item.action();
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#1a1a1a] transition-colors text-left group"
                    >
                      <Icon className="w-5 h-5 text-[#0052FF]" />
                      <span className="flex-1 text-sm text-gray-200 font-medium group-hover:text-white">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-[#222] bg-[#111]">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-[#ff5f6e] hover:bg-[#ff5f6e]/10 rounded-xl transition-colors font-bold"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
