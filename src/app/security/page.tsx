'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, KeyRound, Check, X, User, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getUserBalance } from '@/app/dashboard/actions';

export default function SecurityPage() {
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [vipLevel, setVipLevel] = useState('Bronze');
  const [creditScore, setCreditScore] = useState(700);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email || '');
        setUid(user.id.split('-')[0].toUpperCase());
        const providers = user.app_metadata?.providers || [];
        setHasPassword(providers.includes('email'));
        
        getUserBalance(user.id).then(res => {
          if (res.success) {
            setVipLevel(res.vipLevel || 'Bronze');
            setCreditScore(res.creditScore ?? 700);
          }
        });
      } else {
        router.push('/login');
      }
    });
  }, [supabase, router]);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword !== '';

  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && isMatch;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (hasPassword && !currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (!isPasswordValid) {
      setError('New password does not meet all security requirements or passwords do not match.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (hasPassword) {
        // Step 1: Verify current password by attempting to re-authenticate
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error('Incorrect current password.');
        }
      }

      // Step 2: Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true); // Once updated, they now have a password
      
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing the password.');
    } finally {
      setIsLoading(false);
    }
  };

  const getVipColor = () => {
    if (vipLevel === 'Silver') return 'text-gray-300';
    if (vipLevel === 'Gold') return 'text-yellow-400';
    if (vipLevel === 'Diamond') return 'text-cyan-400';
    return 'text-amber-500';
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0a] text-white font-sans">
      <Header />
      
      {/* Mobile Header */}
      <header className="flex md:hidden items-center justify-between px-4 py-4 shrink-0 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Security Center</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-3xl mx-auto w-full pt-4 md:pt-8 px-4">
          
          <div className="hidden md:flex items-center gap-3 mb-6">
             <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors">
               <ArrowLeft className="w-6 h-6" />
             </button>
             <h2 className="text-2xl font-bold">Security Center</h2>
          </div>

          <div className="flex flex-col gap-6">
            
            {/* Profile Section */}
            <div className="bg-[#111] rounded-3xl p-6 md:p-8 shadow-xl border border-[#222]">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#BF953F]/10 border border-[#BF953F]/20 flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-[#BF953F]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{email}</h3>
                  <div className="text-sm text-gray-500 mt-1">UID: {uid}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">VIP Level</div>
                  <div className={`text-lg font-bold uppercase ${getVipColor()}`}>{vipLevel}</div>
                </div>
                <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
                  <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Credit Score</div>
                  <div className="text-lg font-bold text-[#00C29A]">{creditScore}</div>
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="bg-[#111] rounded-3xl p-6 md:p-8 shadow-xl border border-[#222]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <KeyRound className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#FF4444] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#FF4444]">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-[#00C29A]/10 border border-[#00C29A]/20 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#00C29A] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#00C29A]">{success}</p>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {hasPassword && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#BF953F] transition-colors"
                      placeholder="Enter current password"
                      required={hasPassword}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#BF953F] transition-colors"
                    placeholder="Enter new password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#BF953F] transition-colors"
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                {/* Password Rules UI */}
                <div className="bg-[#161616] rounded-xl p-4 mt-4 border border-[#222]">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Password Requirements</p>
                  <ul className="space-y-2 text-sm">
                    <li className={`flex items-center gap-2 ${hasMinLength ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {hasMinLength ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} At least 8 characters
                    </li>
                    <li className={`flex items-center gap-2 ${hasUpper ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {hasUpper ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} At least 1 uppercase letter (A-Z)
                    </li>
                    <li className={`flex items-center gap-2 ${hasLower ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {hasLower ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} At least 1 lowercase letter (a-z)
                    </li>
                    <li className={`flex items-center gap-2 ${hasNumber ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {hasNumber ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} At least 1 number (0-9)
                    </li>
                    <li className={`flex items-center gap-2 ${hasSpecial ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {hasSpecial ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} At least 1 special character (!@#$...)
                    </li>
                    <li className={`flex items-center gap-2 ${isMatch && newPassword ? 'text-[#00C29A]' : 'text-gray-500'}`}>
                      {isMatch && newPassword ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />} Passwords match
                    </li>
                  </ul>
                </div>

                <button 
                  type="submit"
                  disabled={!isPasswordValid || isLoading}
                  className="w-full bg-[#BF953F] hover:bg-[#9E7B35] disabled:bg-[#BF953F]/50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold mt-6 transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>

            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
