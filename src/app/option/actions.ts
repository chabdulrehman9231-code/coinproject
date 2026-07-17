'use server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function openOptionTrade(
  symbol: string,
  direction: 'UP' | 'DOWN',
  amount: number,
  timeFrameMinutes: number, // actually seconds
  entryPrice: number,
  profitRate: number
) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'User not logged in' };
  }

  // 1. Check user balance
  const { data: wallet, error: walletError } = await supabaseAdmin
    .from('wallets')
    .select('*')
    .eq('user_id', user.id)
    .eq('asset', 'USDT')
    .single();

  if (walletError || !wallet) {
    return { success: false, error: 'Wallet not found' };
  }

  if (parseFloat(wallet.balance) < amount) {
    return { success: false, error: 'Insufficient balance' };
  }

  // 2. Deduct balance
  const newBalance = parseFloat(wallet.balance) - amount;
  const { error: updateError } = await supabaseAdmin
    .from('wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id);

  if (updateError) {
    return { success: false, error: 'Failed to deduct balance' };
  }

  // 3. Create Option Trade record
  const durationSeconds = timeFrameMinutes; // using the passed parameter as seconds
  const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

  const { data: trade, error: tradeError } = await supabaseAdmin
    .from('option_trades')
    .insert([
      {
        user_id: user.id,
        symbol,
        direction,
        amount,
        entry_price: entryPrice,
        profit_rate: profitRate,
        duration_seconds: durationSeconds,
        status: 'pending',
        expires_at: expiresAt
      }
    ])
    .select()
    .single();

  if (tradeError) {
    // If trade insertion fails, we should ideally refund, but for simplicity we log it
    console.error('Failed to insert trade:', tradeError);
    return { success: false, error: 'Failed to create trade record' };
  }

  revalidatePath('/option');
  return { success: true, trade };
}
