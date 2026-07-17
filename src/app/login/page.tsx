'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOtpEmail } from '@/app/verify-otp/actions';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if URL has ?mode=signup
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get('mode') === 'signup') {
        setIsLogin(false);
      }
    }

    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from('users').select('role').eq('id', session.user.id).single().then(({ data }) => {
          if (data?.role === 'superadmin') {
            supabase.auth.signOut();
            setError("Access Denied: Super Admins must use the /admin portal.");
          } else {
            router.push('/dashboard');
          }
        });
      }
    });
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Block super admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (userData?.role === 'superadmin') {
          await supabase.auth.signOut();
          throw new Error("Access Denied: Super Admins must use the /admin portal.");
        }

        router.push('/dashboard');
      } else {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              phone_number: phone || null,
            }
          }
        });
        
        if (error) throw error;

        // Send OTP and Redirect
        const res = await sendOtpEmail(email, fullName);
        if (!res.success) {
          throw new Error("Account created, but failed to send verification email: " + res.error);
        }

        router.push(`/verify-otp?email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0a] p-4 relative overflow-hidden">
      
      {/* Custom Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 z-50 rounded-xl bg-[#00C29A]/10 border border-[#00C29A]/30 p-4 shadow-[0_0_20px_rgba(0,194,154,0.2)] flex items-center gap-3 backdrop-blur-md"
          >
            <div className="rounded-full bg-[#00C29A] p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-[#00C29A] font-medium">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00C29A]/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] rounded-[24px] border border-white/5 bg-[#121212] p-8 shadow-2xl relative z-10"
      >
        
        <div className="flex justify-center mb-6">
           {/* Logo */}
            <motion.svg 
             initial={{ scale: 0.8 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 10 }}
             width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"
            >
               <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm0-10.667c2.946 0 5.333-2.387 5.333-5.333S18.946 10.667 16 10.667 10.667 13.054 10.667 16s2.387 5.333 5.333 5.333z" fill="#0052FF"/>
            </motion.svg>
        </div>

        <motion.h2 
          key={isLogin ? 'login-title' : 'signup-title'}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-center mb-8 text-white"
        >
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </motion.h2>
        
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
        </AnimatePresence>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative pb-1">
                  <UserIcon className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Full name"
                    required={!isLogin}
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <input 
              type="email" 
              placeholder="Email address"
              required 
              className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative pt-1">
                  <Phone className="absolute left-4 top-5 h-5 w-5 text-gray-500" />
                  <input 
                    type="tel" 
                    placeholder="Phone number (optional)"
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="relative">
            <Lock className="absolute left-4 top-4 h-5 w-5 text-gray-500" />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Password (min 6 chars)"
              required 
              className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative pt-1">
                  <Lock className="absolute left-4 top-5 h-5 w-5 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="Confirm password"
                    required={!isLogin}
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0052FF] focus:outline-none focus:ring-1 focus:ring-[#0052FF] transition-all"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0052FF] p-4 text-sm font-bold text-white hover:bg-[#0040CC] focus:outline-none focus:ring-2 focus:ring-[#0052FF] focus:ring-offset-2 focus:ring-offset-[#121212] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,82,255,0.3)] mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333]"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-[#121212] px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#1a1a1a] p-4 text-sm font-bold text-white hover:bg-[#222] focus:outline-none focus:ring-1 focus:ring-white/20 transition-all disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google
        </button>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={switchMode}
            className="text-[#0052FF] hover:text-[#3385ff] font-semibold transition-colors focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
