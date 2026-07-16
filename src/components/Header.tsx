'use client';
import { useState } from 'react';
import { Search, Bell, User } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import UserDrawer from './UserDrawer';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
            <span className="text-xl font-extrabold tracking-tight text-white">Coinbase<span className="font-light text-[#0052FF]"> Trrades</span></span>
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
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-md bg-[#161616] border border-[#222] px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Search coin..." className="bg-transparent text-sm text-white focus:outline-none w-48" />
          </div>
          
          <div className="relative cursor-pointer hover:text-white text-gray-400">
            <Bell className="h-5 w-5" />
            <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#0a0a0a]" />
          </div>

          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-8 h-8 ml-2 rounded-full border border-[#0052FF] flex items-center justify-center cursor-pointer hover:bg-[#0052FF]/10 transition-colors"
          >
            <User className="w-5 h-5 text-[#0052FF]" />
          </div>
        </div>
      </header>

      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </>
  );
}
