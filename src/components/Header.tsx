'use client';
import { useState, useEffect } from 'react';
import { Bell, User, EyeOff, Eye, MessageSquare } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import UserDrawer from './UserDrawer';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance } from '@/app/dashboard/actions';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [showBalance, setShowBalance] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBalance = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const res = await getUserBalance(session.user.id);
        if (res.success) {
          setBalance(res.balance || 0);
        }
      }
    };
    fetchBalance();
  }, []);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Trade', path: '/trade' },
    { name: 'Option', path: '/option' },
    { name: 'Assets', path: '/assets' },
  ];

  return (
    <>
      <header className="hidden md:flex h-16 items-center justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-6 sticky top-0 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm0-10.667c2.946 0 5.333-2.387 5.333-5.333S18.946 10.667 16 10.667 10.667 13.054 10.667 16s2.387 5.333 5.333 5.333z" fill="#0052FF"/>
            </svg>
            <span className="text-xl font-extrabold tracking-tight text-white">Coinbase<span className="font-light text-[#0052FF]"> Trades</span></span>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => {
               const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
               return (
                <Link key={item.name} href={item.path} className={`transition-colors font-bold ${isActive ? 'text-[#0052FF]' : 'text-gray-400 hover:text-white'}`}>
                  {item.name}
                </Link>
               );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Balance Box */}
          <div className="flex items-center gap-3 bg-[#111] border border-white/5 rounded-full px-4 py-1.5 mr-2 shadow-sm">
            <span className="text-gray-400 text-[15px]">Total</span>
            <span className="text-white font-bold text-[15px]">{showBalance ? `${balance.toFixed(2)} USDT` : '******'}</span>
            <button onClick={() => setShowBalance(!showBalance)} className="hover:text-gray-300 transition-colors ml-1 p-1">
              {showBalance ? <Eye className="w-4 h-4 text-gray-500" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
            </button>
          </div>
          
          {/* Message Icon */}
          <div onClick={() => router.push('/chat')} className="relative cursor-pointer hover:text-white text-gray-400 mx-2 transition-colors">
            <MessageSquare className="h-[22px] w-[22px]" />
          </div>

          {/* Bell Icon */}
          <div className="relative cursor-pointer hover:text-white text-gray-400 mx-2 transition-colors">
            <Bell className="h-[22px] w-[22px]" />
            <div className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full bg-[#f04a27] text-white border-2 border-[#0a0a0a]">1</div>
          </div>

          {/* User Avatar */}
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 ml-2 rounded-full bg-[#cc9900]/10 text-[#d4a042] flex items-center justify-center font-bold text-[13px] cursor-pointer hover:bg-[#cc9900]/20 transition-colors border border-[#cc9900]/20"
          >
            AR
          </div>
        </div>
      </header>

      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
