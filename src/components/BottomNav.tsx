'use client';
import { Home, LineChart, Wallet, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Trade', path: '/trade', icon: LineChart },
    { name: 'Option', path: '/option', icon: Zap },
    { name: 'Assets', path: '/assets', icon: Wallet },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t border-white/5 bg-[#0a0a0a] flex items-center justify-around h-[68px] pb-safe z-50">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
        return (
          <Link 
            key={item.name} 
            href={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isActive ? 'text-[#0066FF]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-[11px] font-medium">{item.name}</span>
            {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#0066FF]" />}
          </Link>
        );
      })}
    </nav>
  );
}
