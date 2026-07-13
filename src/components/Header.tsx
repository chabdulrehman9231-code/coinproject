'use client';
import { useState, useEffect } from 'react';
import { LayoutGrid, Search, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [balance, setBalance] = useState<string>('0.00');
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) router.push('/'); // Redirect to login if not authenticated
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) router.push('/');
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  useEffect(() => {
    if (user) {
      // Fetch wallet balance
      const fetchBalance = async () => {
        const { data } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .eq('asset', 'USDT')
          .single();
          
        if (data) setBalance(Number(data.balance).toFixed(2));
      };
      fetchBalance();
    }
  }, [user, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary">
          <LayoutGrid className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight text-primary">BINANCE<span className="font-light text-foreground"> CLONE</span></span>
        </div>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <a href="#" className="text-foreground hover:text-primary">Markets</a>
          <a href="#" className="text-foreground hover:text-primary">Trade</a>
          <a href="#" className="text-foreground hover:text-primary">Futures</a>
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-md bg-panel px-3 py-1.5 md:flex">
          <Search className="h-4 w-4 text-muted" />
          <span className="text-sm text-muted">Search coin...</span>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden flex-col items-end md:flex">
                <span className="text-xs text-muted">Demo Balance</span>
                <span className="text-sm font-bold text-foreground">{balance} USDT</span>
              </div>
              <button onClick={handleLogout} className="text-muted hover:text-sell" title="Log Out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <>
              <a href="/" className="text-sm font-medium text-foreground hover:text-primary">Log In</a>
              <a href="/" className="rounded bg-primary px-4 py-1.5 text-sm font-medium text-black hover:bg-primary-hover">Sign Up</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
