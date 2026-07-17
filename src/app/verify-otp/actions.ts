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
    await resend.emails.send({
      from: 'CoinBase Trades <noreply@coinbasetrades.com>',
      to: [email],
      subject: 'Your Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100%; height: 100%;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a; width: 100%; padding: 40px 20px;">
            <tr>
              <td align="center">
                <!-- Main Container -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #121212; border-radius: 16px; overflow: hidden; border: 1px solid #222222;">
                  <!-- Header -->
                  <tr>
                    <td align="center" style="padding: 40px 0 30px 0; border-bottom: 1px solid #222222;">
                      <div style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-align: center;">
                        <div style="display: inline-block; width: 32px; height: 32px; background-color: #0052FF; border-radius: 50%; color: white; text-align: center; line-height: 32px; font-weight: bold; font-family: Arial, sans-serif; font-size: 20px; vertical-align: middle; margin-right: 8px;">C</div>
                        <span style="color: #0052FF; vertical-align: middle;">CoinBase</span>
                        <span style="color: #ffffff; vertical-align: middle;"> Trades</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 15px 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">Verify Your Email</h2>
                      <p style="margin: 0 0 30px 0; color: #a0a0a0; font-size: 16px; line-height: 24px; text-align: center;">
                        Hi <strong style="color: #ffffff;">${fullName}</strong>,<br><br>
                        We're excited to have you on board. Please use the following 6-digit verification code to activate your account.
                      </p>
                      
                      <!-- OTP Box -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <div style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 12px; padding: 20px 30px; display: inline-block;">
                              <div style="color: #0052FF; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${otp}</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 20px; text-align: center;">
                        If you didn't request this code, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f0f0f; padding: 20px 30px; text-align: center; border-top: 1px solid #222222;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} CoinBase Trades. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
