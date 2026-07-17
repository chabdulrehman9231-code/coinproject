'use server';

import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail(email: string, fullName: string) {
  try {
    // Generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // The users row is created by a DB trigger on auth.users insert.
    // Give it a tiny moment to exist.
    await new Promise(res => setTimeout(res, 1000));

    // Store in database
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({ otp_code: otp, is_verified: false })
      .eq('email', email)
      .select();
      
    if (error) throw error;
    if (!updated || updated.length === 0) {
      throw new Error("User record not found in database. Please try again.");
    }

    // Send email
    // Note: If you have a verified domain on Resend, replace 'onboarding@resend.dev' with your domain email
    await resend.emails.send({
      from: 'Coinbase <onboarding@resend.dev>',
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #050505; color: white;">
          <h2 style="color: #0052FF;">Welcome to Coinbase, ${fullName}!</h2>
          <p>Your account verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; color: #00C29A;">${otp}</div>
          <p style="color: #888;">Please enter this code on the verification page to activate your account. Do not share this code with anyone.</p>
        </div>
      `,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyOtpCode(email: string, otp: string) {
  try {
    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, otp_code')
      .eq('email', email)
      .single();

    if (userError || !user) throw new Error("User not found");
    if (!user.otp_code) throw new Error("No pending verification found");
    if (user.otp_code !== otp) throw new Error("Invalid verification code");

    // Mark as verified and clear OTP
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ is_verified: true, otp_code: null })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
