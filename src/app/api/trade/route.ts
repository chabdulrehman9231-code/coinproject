import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { side, symbol, amount, price } = await request.json();
    const totalCost = Number(amount) * Number(price);

    // Create a Supabase admin client to bypass RLS for server-side operations
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Auth verification (simulate taking user token from headers if we used createServerClient, 
    // but here we can just use the admin client if we pass user_id, 
    // wait, we need to know WHICH user is making the request!)
    
    // Better: use @supabase/ssr to get the session cookie, then use adminClient for DB writes.
    const { createClient: createServerSupabase } = require('@supabase/ssr');
    const { cookies } = require('next/headers');
    const cookieStore = await cookies();
    const supabase = createServerSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
            } catch {}
          }
        }
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch balances
    const { data: wallets } = await adminClient.from('wallets').select('*').eq('user_id', user.id);
    const usdtWallet = wallets?.find(w => w.asset === 'USDT');
    const btcWallet = wallets?.find(w => w.asset === 'BTC');

    const usdtBalance = Number(usdtWallet?.balance || 0);
    const btcBalance = Number(btcWallet?.balance || 0);

    if (side === 'BUY') {
      if (usdtBalance < totalCost) return NextResponse.json({ error: 'Insufficient USDT' }, { status: 400 });
      
      await adminClient.from('wallets').update({ balance: usdtBalance - totalCost }).eq('id', usdtWallet.id);
      if (btcWallet) {
        await adminClient.from('wallets').update({ balance: btcBalance + Number(amount) }).eq('id', btcWallet.id);
      } else {
        await adminClient.from('wallets').insert({ user_id: user.id, asset: 'BTC', balance: Number(amount) });
      }
    } else if (side === 'SELL') {
      if (btcBalance < Number(amount)) return NextResponse.json({ error: 'Insufficient BTC' }, { status: 400 });
      
      await adminClient.from('wallets').update({ balance: btcBalance - Number(amount) }).eq('id', btcWallet.id);
      if (usdtWallet) {
        await adminClient.from('wallets').update({ balance: usdtBalance + totalCost }).eq('id', usdtWallet.id);
      } else {
        await adminClient.from('wallets').insert({ user_id: user.id, asset: 'USDT', balance: totalCost });
      }
    }

    // Record trade
    await adminClient.from('orders').insert({
      user_id: user.id,
      symbol,
      order_type: 'MARKET',
      side,
      price,
      amount,
      status: 'FILLED'
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
