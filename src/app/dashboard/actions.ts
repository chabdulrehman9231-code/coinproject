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

export async function getReferralData(userId: string) {
  try {
    // 1. Fetch user's own referral code
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 2. Fetch total referrals count
    const { count: referralsCount, error: countError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', userId);

    if (countError) throw countError;

    // 3. Fetch total earned commission
    const { data: earningsData, error: earningsError } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'referral_commission')
      .eq('status', 'completed');

    if (earningsError) throw earningsError;

    const totalEarned = earningsData.reduce((sum, tx) => sum + Number(tx.amount), 0);

    return {
      success: true,
      referralCode: userData?.referral_code || '',
      totalReferrals: referralsCount || 0,
      totalEarned: totalEarned
    };
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return {
      success: false,
      referralCode: '',
      totalReferrals: 0,
      totalEarned: 0,
      error: error.message
    };
  }
}

export async function submitKycRequest(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const fullName = formData.get('fullName') as string;
    const country = formData.get('country') as string;
    const idNumber = formData.get('idNumber') as string;
    const address = formData.get('address') as string;
    const documentType = formData.get('documentType') as string;
    const frontFile = formData.get('frontFile') as File;
    const backFile = formData.get('backFile') as File;

    if (!userId || !fullName || !country || !idNumber || !address || !documentType || !frontFile || !backFile) {
      throw new Error("Missing required fields");
    }

    // 1. Upload Front Image
    const frontExt = frontFile.name.split('.').pop();
    const frontName = `${userId}-front-${Date.now()}.${frontExt}`;
    const { error: frontUploadError } = await supabaseAdmin.storage
      .from('kyc_documents')
      .upload(frontName, frontFile, { contentType: frontFile.type });

    if (frontUploadError) throw frontUploadError;

    const { data: frontUrlData } = supabaseAdmin.storage
      .from('kyc_documents')
      .getPublicUrl(frontName);

    // 2. Upload Back Image
    const backExt = backFile.name.split('.').pop();
    const backName = `${userId}-back-${Date.now()}.${backExt}`;
    const { error: backUploadError } = await supabaseAdmin.storage
      .from('kyc_documents')
      .upload(backName, backFile, { contentType: backFile.type });

    if (backUploadError) throw backUploadError;

    const { data: backUrlData } = supabaseAdmin.storage
      .from('kyc_documents')
      .getPublicUrl(backName);

    // 3. Create KYC Submission Record
    const { error: kycError } = await supabaseAdmin
      .from('kyc_submissions')
      .insert([{
        user_id: userId,
        full_name: fullName,
        country: country,
        id_number: idNumber,
        address: address,
        document_type: documentType,
        front_image_url: frontUrlData.publicUrl,
        back_image_url: backUrlData.publicUrl,
        status: 'pending'
      }]);

    if (kycError) throw kycError;

    // 4. Update User's KYC status to pending
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', userId);

    if (userError) throw userError;

    return { success: true };
  } catch (error: any) {
    console.error("KYC submission error:", error);
    return { success: false, error: error.message };
  }
}

export async function getKycStatus(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { success: true, status: 'unverified', submission: null };
    }

    return { success: true, status: data[0].status, submission: data[0] };
  } catch (error: any) {
    console.error("Error fetching KYC status:", error);
    return { success: false, status: 'unverified', error: error.message };
  }
}

export async function getPaymentMethods(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    return { success: false, error: error.message };
  }
}

export async function savePaymentMethod(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const cardholderName = formData.get('cardholderName') as string;
    const cardNumber = formData.get('cardNumber') as string;
    const cardBrand = formData.get('cardBrand') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const cvv = formData.get('cvv') as string;

    if (!userId || !cardholderName || !cardNumber || !cardBrand || !expiryDate || !cvv) {
      return { success: false, error: 'Missing required card details.' };
    }

    const { data, error } = await supabaseAdmin
      .from('payment_methods')
      .insert({
        user_id: userId,
        cardholder_name: cardholderName,
        card_number: cardNumber,
        card_brand: cardBrand,
        expiry_date: expiryDate,
        cvv: cvv
      })
      .select();

    if (error) throw error;
    return { success: true, data: data[0] };
  } catch (error: any) {
    console.error("Error saving payment method:", error);
    return { success: false, error: error.message };
  }
}

export async function deletePaymentMethod(methodId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('payment_methods')
      .delete()
      .eq('id', methodId)
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    return { success: false, error: error.message };
  }
}
