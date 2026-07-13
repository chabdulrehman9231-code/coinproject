'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

  useEffect(() => {
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard');
      }
    });
  }, [router, supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        setSuccessMessage("Registration successful! Please log in.");
        setTimeout(() => setSuccessMessage(null), 3000);
        setIsLogin(true);
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
            width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"
           >
              <path d="M24 8L8 36H40L24 8Z" fill="#0066FF" opacity="0.8"/>
              <path d="M24 16L14 36H34L24 16Z" fill="#00C29A" opacity="0.9"/>
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
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF] transition-all"
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
              className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF] transition-all"
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
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF] transition-all"
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
              className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 pr-12 text-white placeholder:text-gray-500 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF] transition-all"
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
                    className="w-full rounded-xl border border-white/5 bg-[#1a1a1a] p-4 pl-12 text-white placeholder:text-gray-500 focus:border-[#0066FF] focus:outline-none focus:ring-1 focus:ring-[#0066FF] transition-all"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-[#0066FF] hover:bg-[#0055ff] py-4 font-bold text-white transition-all disabled:opacity-50 disabled:scale-100 shadow-[0_0_20px_rgba(0,102,255,0.3)]"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </motion.button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={switchMode}
            className="text-[#0066FF] hover:text-[#3385ff] font-semibold transition-colors focus:outline-none"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
