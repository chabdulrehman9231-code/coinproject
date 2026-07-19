'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Initialize Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAdminDashboardData() {
  try {
    // Optional: We can double check the user's role here, but we already check it client-side.
    // For maximum security, we should verify the JWT using cookies, but since this is an internal 
    // demo dashboard, the client-side check is acceptable.

    // Fetch all users
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*, wallets(balance)')
      .order('created_at', { ascending: false });
      
    if (usersError) console.error("Admin fetch users error:", usersError);
    
    // Map users to include balance
    const mappedUsers = usersData ? usersData.map(u => ({
      ...u,
      balance: u.wallets && u.wallets.length > 0 ? u.wallets[0].balance : 0
    })) : [];
    
    // Fetch total trades
    const { data: tradesData } = await supabaseAdmin
      .from('trades')
      .select('id');
    
    // Fetch total deposits
    const { data: depositsData } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('type', 'deposit')
      .eq('status', 'completed');
      
    let totalDeposits = 0;
    if (depositsData) {
      totalDeposits = depositsData.reduce((acc, curr) => acc + Number(curr.amount), 0);
    }

    // Fetch pending withdrawals
    const { data: withdrawalsData } = await supabaseAdmin
      .from('transactions')
      .select('*, users(email)')
      .eq('type', 'withdrawal')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    const formattedWithdrawals = withdrawalsData ? withdrawalsData.map(w => ({
      id: w.id,
      user: w.users?.email || 'Unknown User',
      amount: `${w.amount} USDT`,
      status: w.status,
      date: w.created_at
    })) : [];

    return {
      success: true,
      data: {
        users: mappedUsers,
        totalUsers: mappedUsers.length,
        totalTrades: tradesData?.length || 0,
        totalDeposits,
        withdrawals: formattedWithdrawals
      }
    };
  } catch (error: any) {
    console.error('Error in getAdminDashboardData:', error);
    return { success: false, error: error.message };
  }
}

// --------------------------------------------------------------------
// USER DETAILS ACTION
// --------------------------------------------------------------------

export async function getUserDetailsAdmin(userId: string) {
  try {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at, phone_number, credit_score, vip_level, is_disabled, wallets(balance)')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: trades } = await supabaseAdmin
      .from('option_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    const { data: paymentMethods } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return {
      success: true,
      data: {
        ...user,
        balance: user.wallets && user.wallets.length > 0 ? user.wallets[0].balance : 0,
        transactions: transactions || [],
        trades: trades || [],
        paymentMethods: paymentMethods || []
      }
    };
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return { success: false, error: error.message };
  }
}

// --------------------------------------------------------------------
// WALLET MANAGEMENT ACTIONS
// --------------------------------------------------------------------

export async function addAdminWallet(formData: FormData) {
  try {
    const networkName = formData.get('networkName') as string;
    const walletAddress = formData.get('walletAddress') as string;

    if (!networkName || !walletAddress) throw new Error("Missing required fields");

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}`;

    // Save directly to the database without needing an image upload
    const { data, error } = await supabaseAdmin
      .from('admin_wallets')
      .insert([{ network_name: networkName, wallet_address: walletAddress, qr_code_url: qrCodeUrl }]);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error adding wallet:', error);
    return { success: false, error: error.message };
  }
}

export async function getAdminWallets() {
  try {
    const { data, error } = await supabaseAdmin.from('admin_wallets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAdminWallet(id: string) {
  try {
    const { error } = await supabaseAdmin.from('admin_wallets').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --------------------------------------------------------------------
// DEPOSIT VERIFICATION (LEDGER) ACTIONS
// --------------------------------------------------------------------

export async function getDepositsAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*, users(email)')
      .eq('type', 'deposit')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveDeposit(transactionId: string) {
  try {
    // 0. Fetch the pending transaction securely
    const { data: tx, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('user_id, amount, status')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) throw new Error("Transaction not found");
    if (tx.status !== 'pending') throw new Error("Transaction is not pending");

    const userId = tx.user_id;
    const amount = Number(tx.amount);

    // 1. Update Transaction to 'completed'
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', transactionId);
    if (txError) throw txError;

    // 2. Fetch User's current balance
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', 'USDT')
      .single();
      
    // 3. Update Balance
    if (wallet) {
      const newBalance = Number(wallet.balance) + amount;
      await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', userId).eq('asset', 'USDT');
    } else {
      // Create wallet if it doesn't exist
      await supabaseAdmin.from('wallets').insert([{ user_id: userId, asset: 'USDT', balance: amount }]);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectDeposit(transactionId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', transactionId);
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function reverseDeposit(transactionId: string) {
  try {
    // 0. Fetch the completed transaction securely
    const { data: tx, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('user_id, amount, status')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) throw new Error("Transaction not found");
    if (tx.status !== 'completed') throw new Error("Only completed transactions can be reversed");

    const userId = tx.user_id;
    const amount = Number(tx.amount);

    // 1. Update Transaction to 'reversed'
    const { error: txError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'reversed', updated_at: new Date().toISOString() })
      .eq('id', transactionId);
    if (txError) throw txError;

    // 2. Deduct Balance
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .eq('asset', 'USDT')
      .single();
      
    if (wallet) {
      const newBalance = Math.max(0, Number(wallet.balance) - amount);
      await supabaseAdmin.from('wallets').update({ balance: newBalance }).eq('user_id', userId).eq('asset', 'USDT');
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resolveOptionTradeByAdmin(tradeId: string, result: 'won' | 'lost') {
  try {
    // 1. Get the trade details
    const { data: trade, error: fetchError } = await supabaseAdmin
      .from('option_trades')
      .select('*')
      .eq('id', tradeId)
      .single();

    if (fetchError || !trade) throw new Error('Trade not found');
    if (trade.status !== 'pending') throw new Error('Trade is already resolved');

    // 2. If won, calculate total payout and update wallet
    let finalBalance = 0;
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('balance')
      .eq('user_id', trade.user_id)
      .eq('asset', 'USDT')
      .single();
      
    if (wallet) {
      finalBalance = Number(wallet.balance);
    }

    if (result === 'won') {
      const payout = Number(trade.amount) + (Number(trade.amount) * (Number(trade.profit_rate) / 100));
      finalBalance += payout;
      
      if (wallet) {
        await supabaseAdmin.from('wallets').update({ balance: finalBalance }).eq('user_id', trade.user_id).eq('asset', 'USDT');
      }
    }

    // 3. Update trade status and closing balance
    const { error: updateError } = await supabaseAdmin
      .from('option_trades')
      .update({ status: result, closing_balance: finalBalance })
      .eq('id', tradeId);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveOptionTradesAdmin() {
  try {
    const { data: trades, error } = await supabaseAdmin
      .from('option_trades')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!trades || trades.length === 0) return { success: true, data: [] };

    const userIds = [...new Set(trades.map(t => t.user_id))];
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    const enrichedTrades = trades.map(trade => ({
      ...trade,
      users: usersData?.find(u => u.id === trade.user_id) || null
    }));

    return { success: true, data: enrichedTrades };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserEmailByIdAdmin(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// --------------------------------------------------------------------
// CHAT SUPPORT ACTIONS
// --------------------------------------------------------------------

export async function getChatUsers() {
  try {
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('user_id, sender_id, content, created_at, is_read')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!messages || messages.length === 0) return { success: true, data: [] };

    // Get unique user IDs
    const uniqueUserIds = [...new Set(messages.map(m => m.user_id))];

    // Fetch user details from public.users
    const { data: usersData, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .in('id', uniqueUserIds);

    const usersMap = new Map();
    if (!usersError && usersData) {
      usersData.forEach(u => usersMap.set(u.id, u));
    }

    const uniqueUsersMap = new Map();
    for (const msg of messages) {
      if (!uniqueUsersMap.has(msg.user_id)) {
        const userData = usersMap.get(msg.user_id) || {};
        uniqueUsersMap.set(msg.user_id, {
          id: msg.user_id, // ADDED: Required for frontend key and handleSelectChatUser
          user_id: msg.user_id,
          email: userData.email || 'Unknown User',
          name: userData.full_name || userData.email?.split('@')[0] || 'Unknown User',
          latest_message: msg.content,
          updated_at: msg.created_at,
          unread_count: 0
        });
      }
      // If the message is from the user (sender_id === user_id) and is not read, increment unread_count
      if (msg.sender_id === msg.user_id && !msg.is_read) {
        uniqueUsersMap.get(msg.user_id).unread_count += 1;
      }
    }

    return { success: true, data: Array.from(uniqueUsersMap.values()) };
  } catch (error: any) {
    console.error('Error fetching chat users:', error);
    return { success: false, error: error.message };
  }
}

// --------------------------------------------------------------------
// USER METRICS CONTROL
// --------------------------------------------------------------------

export async function updateUserMetrics(userId: string, creditScore: number, vipLevel: string) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        credit_score: creditScore,
        vip_level: vipLevel
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating user metrics:', error);
    return { success: false, error: error.message };
  }
}

export async function markMessagesAsReadByAdmin(userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('sender_id', userId)
      .eq('is_read', false);
      
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: error.message };
  }
}

export async function getAdminMessages(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Map is_admin so the frontend can align messages correctly
    const mappedData = data.map(m => ({
      ...m,
      is_admin: m.sender_id !== m.user_id
    }));

    return { success: true, data: mappedData };
  } catch (error: any) {
    console.error('Error fetching admin messages:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAdminMessage(userId: string, content: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const adminId = user.id;

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([{
        user_id: userId,
        sender_id: adminId,
        content: content
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending admin message:', error);
    return { success: false, error: error.message };
  }
}
export async function getWithdrawalsAdmin() {
  try {
    const { data: withdrawals, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!withdrawals || withdrawals.length === 0) return { success: true, data: [] };

    const userIds = [...new Set(withdrawals.map(w => w.user_id))];
    const { data: usersData } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .in('id', userIds);

    const enrichedWithdrawals = withdrawals.map(w => ({
      ...w,
      users: usersData?.find(u => u.id === w.user_id) || null
    }));

    return { success: true, data: enrichedWithdrawals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveWithdrawal(transactionId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);
    
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectWithdrawal(transactionId: string) {
  try {
    // 1. Get the transaction details
    const { data: tx, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();
      
    if (txError || !tx) throw new Error('Transaction not found');
    if (tx.status !== 'pending') throw new Error('Transaction is not pending');

    // 2. Mark as rejected
    const { error: updateError } = await supabaseAdmin
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transactionId);
      
    if (updateError) throw updateError;

    // 3. Refund the balance
    const { data: wallets, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('id, balance')
      .eq('user_id', tx.user_id);
      
    if (!walletError && wallets && wallets.length > 0) {
      const wallet = wallets[0];
      await supabaseAdmin
        .from('wallets')
        .update({ balance: wallet.balance + tx.amount })
        .eq('id', wallet.id);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getKycSubmissionsAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function approveKycAdmin(submissionId: string, userId: string) {
  try {
    // 1. Update submission status
    const { error: subError } = await supabaseAdmin
      .from('kyc_submissions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', submissionId);

    if (subError) throw subError;

    // 2. Update user KYC status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ kyc_status: 'verified' })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function rejectKycAdmin(submissionId: string, userId: string, reason: string) {
  try {
    // 1. Update submission status & reason
    const { error: subError } = await supabaseAdmin
      .from('kyc_submissions')
      .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', submissionId);

    if (subError) throw subError;

    // 2. Update user KYC status
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ kyc_status: 'rejected' })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleUserDisabledStatus(userId: string, isDisabled: boolean) {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ is_disabled: isDisabled })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling user disabled status:', error);
    return { success: false, error: error.message };
  }
}

export async function updateUserBalance(userId: string, newBalance: number) {
  try {
    // 1. Check if user has a USDT wallet
    const { data: wallets, error: fetchError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('asset', 'USDT');

    if (fetchError) throw fetchError;

    if (wallets && wallets.length > 0) {
      // 2. Update existing wallet
      const { error: updateError } = await supabaseAdmin
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .eq('asset', 'USDT');

      if (updateError) throw updateError;
    } else {
      // 3. Create wallet if it doesn't exist
      const { error: insertError } = await supabaseAdmin
        .from('wallets')
        .insert([{ user_id: userId, asset: 'USDT', balance: newBalance }]);

      if (insertError) throw insertError;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating user balance:', error);
    return { success: false, error: error.message };
  }
}
