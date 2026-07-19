'use server';

import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetOtp(email: string) {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Don't leak whether the email exists or not for security, just return success generically
      // or we can throw an error depending on UX preference. Let's throw error for better UX in this demo.
      throw new Error("User with this email not found.");
    }

    // Generate a 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ otp_code: otp })
      .eq('email', email);
      
    if (updateError) throw updateError;

    const fullName = user.full_name || 'User';

    const headersList = await headers();
    const host = headersList.get('host') || 'coinflowvip.pro';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const logoUrl = `${protocol}://${host}/logo.png`;

    // Send email
    await resend.emails.send({
      from: 'Coinflow VIP <noreply@coinflowvip.pro>',
      to: [email],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="color-scheme" content="light dark">
          <meta name="supported-color-schemes" content="light dark">
          <title>Reset Your Password</title>
          <style>
            :root {
              color-scheme: light dark;
              supported-color-schemes: light dark;
            }
          </style>
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
                        <img src="${logoUrl}" width="28" height="28" style="vertical-align: middle; margin-right: 8px; display: inline-block;" alt="Coinflow Logo" /><span style="background-image: linear-gradient(#BF953F, #BF953F); -webkit-background-clip: text; background-clip: text; color: #BF953F; -webkit-text-fill-color: transparent; vertical-align: middle;">Coinflow</span><span style="color: #ffffff; vertical-align: middle;"> VIP</span>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 15px 0; color: #ffffff; font-size: 24px; font-weight: 600; text-align: center;">Reset Your Password</h2>
                      <p style="margin: 0 0 30px 0; color: #a0a0a0; font-size: 16px; line-height: 24px; text-align: center;">
                        Hi <strong style="color: #ffffff;">${fullName}</strong>,<br><br>
                        We received a request to reset your password. Please use the following 6-digit verification code to proceed.
                      </p>
                      
                      <!-- OTP Box -->
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td align="center">
                            <div style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 12px; padding: 20px 30px; display: inline-block;">
                              <div style="background-image: linear-gradient(#BF953F, #BF953F); -webkit-background-clip: text; background-clip: text; color: #BF953F; -webkit-text-fill-color: transparent; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: monospace;">${otp}</div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #888888; font-size: 14px; line-height: 20px; text-align: center;">
                        If you didn't request a password reset, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #0f0f0f; padding: 20px 30px; text-align: center; border-top: 1px solid #222222;">
                      <p style="margin: 0; color: #666666; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} Coinflow VIP. All rights reserved.
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

export async function verifyResetOtp(email: string, otp: string) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('otp_code')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new Error("Invalid request.");
    }

    if (user.otp_code !== otp) {
      throw new Error("Incorrect or expired verification code.");
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  try {
    // Re-verify OTP to ensure security
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, otp_code')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      throw new Error("Invalid request.");
    }

    if (user.otp_code !== otp) {
      throw new Error("Verification code has changed or expired.");
    }

    // Update password via Admin API
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateAuthError) {
      throw new Error("Failed to reset password: " + updateAuthError.message);
    }

    // Clear the OTP to prevent reuse
    await supabaseAdmin
      .from('users')
      .update({ otp_code: null })
      .eq('id', user.id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
