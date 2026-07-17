'use client';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyOtpCode, sendOtpEmail } from './actions';

function VerifyOtpContent() {
  const [otp, setOtp] = useState(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const name = searchParams.get('name') || 'User';

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await verifyOtpCode(email, otp.join(''));
      if (!res.success) {
        throw new Error(res.error || "Invalid verification code");
      }
      
      // Success
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    
    setResendLoading(true);
    setError(null);
    setResendMessage(null);
    
    try {
      const res = await sendOtpEmail(email, name);
      if (!res.success) {
        throw new Error(res.error || "Failed to resend code");
      }
      setResendMessage("A new verification code has been sent to your email.");
      setTimeout(() => setResendMessage(null), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0052FF]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] rounded-[24px] border border-white/5 bg-[#121212] p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 rounded-full bg-[#0052FF]/10 flex items-center justify-center border border-[#0052FF]/20 shadow-[0_0_15px_rgba(0,82,255,0.2)]">
             <ShieldCheck className="w-8 h-8 text-[#0052FF]" />
           </div>
        </div>

        <h2 className="text-2xl font-bold text-center mb-2 text-white">
          Verify Your Email
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          We've sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>. Please enter it below to activate your account.
        </p>
        
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20 text-center"
            >
              {error}
            </motion.div>
          )}
          {resendMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-lg bg-[#00C29A]/10 p-3 text-sm text-[#00C29A] border border-[#00C29A]/20 text-center"
            >
              {resendMessage}
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-between gap-2 w-full">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 md:w-14 md:h-16 rounded-xl border border-white/5 bg-[#1a1a1a] text-white text-center font-bold text-2xl focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
              />
            ))}
          </div>
          
          <button
            type="submit"
            disabled={loading || otp.join('').length !== 6}
            className="w-full rounded-xl bg-[#0052FF] p-4 text-sm font-bold text-white hover:bg-[#0040CC] focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,82,255,0.3)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying...
              </span>
            ) : (
              <>Verify & Continue <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          Didn't receive the code?{' '}
          <button 
            type="button" 
            onClick={handleResend}
            disabled={resendLoading}
            className="text-[#0052FF] hover:text-[#3385ff] font-semibold transition-colors focus:outline-none disabled:opacity-50"
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
