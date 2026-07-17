'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function submitDepositRequest(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const amount = formData.get('amount') as string;
    const targetWallet = formData.get('targetWallet') as string;
    const proofFile = formData.get('proofFile') as File;

    if (!userId || !amount || !targetWallet || !proofFile) {
      throw new Error("Missing required fields");
    }

    // 1. Upload Proof Image
    const fileExt = proofFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}-${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabaseAdmin.storage
      .from('deposit_proofs')
      .upload(fileName, proofFile, { contentType: proofFile.type });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('deposit_proofs')
      .getPublicUrl(fileName);

    // 2. Create Transaction Record
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: userId,
        type: 'deposit',
        amount: Number(amount),
        status: 'pending',
        target_wallet: targetWallet,
        proof_image_url: publicUrlData.publicUrl
      }]);

    if (txError) throw txError;

    return { success: true };
  } catch (error: any) {
    console.error("Deposit submission error:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserBalance(userId: string) {
  try {
    const [walletRes, userRes] = await Promise.all([
      supabaseAdmin
        .from('wallets')
        .select('balance')
        .eq('user_id', userId)
        .eq('asset', 'USDT')
        .single(),
      supabaseAdmin
        .from('users')
        .select('credit_score, vip_level')
        .eq('id', userId)
        .single()
    ]);

    const balance = walletRes.data ? Number(walletRes.data.balance) : 0;
    const creditScore = userRes.data?.credit_score ?? 700;
    const vipLevel = userRes.data?.vip_level || 'Bronze';

    return { success: true, balance, creditScore, vipLevel };
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    return { success: false, balance: 0, error: error.message };
  }
}
export async function getUserTransactions(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    return { success: false, data: [], error: error.message };
  }
}
export async function getUserOptionTrades(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('option_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error fetching option trades:', error);
    return { success: false, data: [], error: error.message };
  }
}
export async function submitWithdrawalRequest(userId: string, amount: number, network: string, address: string) {
  try {
    // Verify balance
    const { data: wallets, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', userId);
      
    if (walletError || !wallets || wallets.length === 0) throw new Error('Wallet not found');
    
    const wallet = wallets[0];
    if (wallet.balance < amount) throw new Error('Insufficient balance');

    // Deduct balance immediately
    const newBalance = wallet.balance - amount;
    const { error: updateError } = await supabaseAdmin
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);
      
    if (updateError) throw updateError;

    // Create withdrawal transaction
    // Using target_wallet for network and proof_image_url for destination address
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .insert([{
        user_id: userId,
        type: 'withdrawal',
        amount: amount,
        status: 'pending',
        target_wallet: network,
        proof_image_url: address
      }]);
      
    if (txError) {
      // Rollback balance if transaction creation fails
      await supabaseAdmin.from('wallets').update({ balance: wallet.balance }).eq('id', wallet.id);
      throw txError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error submitting withdrawal:', error);
    return { success: false, error: error.message };
  }
}
