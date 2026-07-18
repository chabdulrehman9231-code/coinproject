'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, DollarSign, Activity, CheckCircle, 
  XCircle, Lock, Unlock, ShieldAlert, ChevronRight, LogOut, ArrowLeft, TrendingUp, TrendingDown, Clock, CreditCard, Award, Wallet, MessageSquare, BarChart3, Image as ImageIcon, Trash2, Send, Menu, X, ChevronDown
} from 'lucide-react';
import { formatMessage } from '@/lib/utils/formatMessage';
import { 
  getAdminDashboardData, getUserDetailsAdmin, 
  addAdminWallet, getAdminWallets, deleteAdminWallet,
  getDepositsAdmin, approveDeposit, rejectDeposit, reverseDeposit,
  getWithdrawalsAdmin, approveWithdrawal, rejectWithdrawal,
  resolveOptionTradeByAdmin, getActiveOptionTradesAdmin,
  getChatUsers, getAdminMessages, sendAdminMessage, markMessagesAsReadByAdmin,
  updateUserMetrics,
  getKycSubmissionsAdmin, approveKycAdmin, rejectKycAdmin
} from './actions';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>({ users: [], totalUsers: 0, totalTrades: 0, totalDeposits: 0, withdrawals: [] });
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  const [editCreditScore, setEditCreditScore] = useState<number>(700);
  const [editVipLevel, setEditVipLevel] = useState<string>('Bronze');
  const [isVipDropdownOpen, setIsVipDropdownOpen] = useState(false);
  const [isUpdatingMetrics, setIsUpdatingMetrics] = useState(false);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [resolvingTrade, setResolvingTrade] = useState<{id: string, result: 'won'|'lost', tradeInfo: any}|null>(null);
  
  const [kycSubmissions, setKycSubmissions] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Settings states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    checkAdmin();
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAdmin && activeTab === 'trades') {
      const fetchTrades = async () => {
        try {
          const tRes = await getActiveOptionTradesAdmin();
          if (tRes.success) setActiveTrades(tRes.data || []);
        } catch (error) {
          console.error("fetchTrades polling error:", error);
        }
      };
      fetchTrades(); // Fetch immediately on tab switch
      interval = setInterval(fetchTrades, 2000); // Poll every 2 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, isAdmin]);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role === 'superadmin') {
      setIsAdmin(true);
      fetchAllData();
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { data: userData } = await supabase.from('users').select('role').eq('id', data.user.id).single();
        if (userData?.role === 'superadmin') {
          setIsAdmin(true);
          fetchAllData();
        } else {
          await supabase.auth.signOut();
          setLoginError('Unauthorized: Super Admin access required');
        }
      }
    } catch (err: any) {
      setLoginError(err.message || 'Failed to login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchAllData = async () => {
    try {
      const res = await getAdminDashboardData();
      if (res.success) setDashboardData(res.data);
      const wRes = await getAdminWallets();
      if (wRes.success) setWallets(wRes.data || []);
      const dRes = await getDepositsAdmin();
      if (dRes.success) setDeposits(dRes.data || []);
      const withRes = await getWithdrawalsAdmin();
      if (withRes.success) setWithdrawals(withRes.data || []);
      const tRes = await getActiveOptionTradesAdmin();
      if (tRes.success) setActiveTrades(tRes.data || []);
      const cRes = await getChatUsers();
      if (cRes.success) setChatUsers(cRes.data || []);
      
      const kycRes = await getKycSubmissionsAdmin();
      if (kycRes.success) setKycSubmissions(kycRes.data || []);
    } catch (error) {
      console.error("fetchAllData error:", error);
    }
  };

  const handleApproveKyc = async (id: string, userId: string) => {
    const res = await approveKycAdmin(id, userId);
    if (res.success) {
      const kycRes = await getKycSubmissionsAdmin();
      if (kycRes.success) setKycSubmissions(kycRes.data || []);
    }
  };

  const handleRejectKyc = async (id: string, userId: string) => {
    if (!rejectionReason.trim()) return;
    const res = await rejectKycAdmin(id, userId, rejectionReason);
    if (res.success) {
      setRejectionReason('');
      setIsRejectModalOpen(false);
      setSelectedKyc(null);
      const kycRes = await getKycSubmissionsAdmin();
      if (kycRes.success) setKycSubmissions(kycRes.data || []);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError('');
    setSettingsSuccess('');

    if (newPassword !== confirmPassword) {
      setSettingsError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setSettingsError('New password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated properly");

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) throw new Error('Incorrect current password.');

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSettingsSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setSettingsError(err.message || 'An error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- Users Actions ---
  const handleViewUser = async (id: string) => {
    setSelectedUserDetail(id);
    setIsUserDetailLoading(true);
    const res = await getUserDetailsAdmin(id);
    if (res.success && res.data) {
      setUserDetailData(res.data);
      setEditCreditScore(res.data.credit_score ?? 700);
      setEditVipLevel(res.data.vip_level || 'Bronze');
    }
    setIsUserDetailLoading(false);
  };

  const handleUpdateMetrics = async () => {
    if (!selectedUserDetail) return;
    setIsUpdatingMetrics(true);
    const res = await updateUserMetrics(selectedUserDetail, editCreditScore, editVipLevel);
    if (res.success) {
      // Re-fetch details to update UI
      const uRes = await getUserDetailsAdmin(selectedUserDetail);
      if (uRes.success) {
        setUserDetailData(uRes.data);
      }
      alert('User metrics updated successfully!');
    } else {
      alert('Failed to update metrics: ' + res.error);
    }
    setIsUpdatingMetrics(false);
  };

  // --- Wallet Actions ---
  const handleAddWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    await addAdminWallet(formData);
    form.reset();
    
    const wRes = await getAdminWallets();
    if (wRes.success) setWallets(wRes.data || []);
  };
  const handleDeleteWallet = async (id: string) => {
    await deleteAdminWallet(id);
    const wRes = await getAdminWallets();
    if (wRes.success) setWallets(wRes.data || []);
  };

  // --- Funds Actions ---
  const handleApproveDeposit = async (id: string) => {
    await approveDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data || []);
  };
  const handleRejectDeposit = async (id: string) => {
    await rejectDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data || []);
  };
  const handleReverseDeposit = async (id: string) => {
    await reverseDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data || []);
  };

  const handleApproveWithdrawal = async (id: string) => {
    await approveWithdrawal(id);
    const withRes = await getWithdrawalsAdmin();
    if (withRes.success) setWithdrawals(withRes.data || []);
  };
  const handleRejectWithdrawal = async (id: string) => {
    await rejectWithdrawal(id);
    const withRes = await getWithdrawalsAdmin();
    if (withRes.success) setWithdrawals(withRes.data || []);
  };

  // --- Trades Actions ---
  const handleResolveTrade = async (id: string, result: 'won' | 'lost') => {
    await resolveOptionTradeByAdmin(id, result);
    const tRes = await getActiveOptionTradesAdmin();
    if (tRes.success) setActiveTrades(tRes.data || []);
  };

  // --- Chat Actions ---
  const handleSelectChatUser = async (u: any) => {
    setSelectedChatUser(u);
    const targetId = u.id || u.user_id;
    await markMessagesAsReadByAdmin(targetId);
    fetchMessages(targetId);
  };
  const fetchMessages = async (userId: string) => {
    try {
      const res = await getAdminMessages(userId);
      if (res.success) {
        setChatMessages(res.data || []);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (error) {
      console.error("fetchMessages error:", error);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim() || !selectedChatUser) return;
    const msg = chatInput;
    setChatInput('');
    const targetId = selectedChatUser.id || selectedChatUser.user_id;
    await sendAdminMessage(targetId, msg);
    fetchMessages(targetId);
  };

  useEffect(() => {
    if (!selectedChatUser) return;
    const targetId = selectedChatUser.id || selectedChatUser.user_id;

    const channel = supabase
      .channel(`admin_messages_${targetId}_${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${targetId}`,
      }, (payload) => {
        setChatMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          const mappedMsg = {
            ...payload.new,
            is_admin: payload.new.sender_id !== payload.new.user_id
          };
          return [...prev, mappedMsg];
        });
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChatUser, supabase]);

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Admin...</div>;
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white font-sans p-4">
        <div className="w-full max-w-md bg-[#111] p-8 rounded-3xl border border-[#222] shadow-2xl">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Lock className="w-8 h-8 text-[#0052FF]" />
            <h1 className="text-2xl font-bold">Super Admin Login</h1>
          </div>
          
          {loginError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p>{loginError}</p>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Admin Email</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-[#0052FF] hover:bg-[#0040CC] text-white font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {isLoggingIn ? 'Verifying...' : 'Access Dashboard'}
              {!isLoggingIn && <ChevronRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 w-full h-16 bg-[#111] border-b border-[#222] z-10 flex items-center justify-between px-4">
        <div>
          <h1 className="text-xl font-extrabold text-[#0052FF]">Super Admin</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-400 hover:text-white bg-[#1a1a1a] rounded-lg border border-[#333]">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-20" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 w-64 bg-[#111] border-r border-[#222] flex flex-col z-30 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 border-b border-[#222] flex justify-between items-center">
          <div>
            <h1 className="text-xl font-extrabold text-[#0052FF]">Super Admin</h1>
            <p className="text-xs text-gray-500 mt-1">Coinbase Trades</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-white bg-[#1a1a1a] rounded-lg border border-[#333]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'wallets', icon: Wallet, label: 'Wallet Manager' },
            { id: 'funds', icon: DollarSign, label: 'Funds Manager' },
            { id: 'kyc', icon: CheckCircle, label: 'KYC Submissions' },
            { id: 'trades', icon: BarChart3, label: 'Live Trades' },
            { id: 'chat', icon: MessageSquare, label: 'Support Chat' },
            { id: 'settings', icon: Lock, label: 'Settings' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); localStorage.setItem('adminActiveTab', tab.id); setSelectedUserDetail(null); setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-[#0052FF]/10 text-[#0052FF] border-r-2 border-[#0052FF]' : 'text-gray-400 hover:text-white'}`}
            >
              <tab.icon className="w-5 h-5" /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#222]">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && !selectedUserDetail && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#161616] p-6 rounded-2xl border border-[#222]">
                  <div className="flex items-center gap-3 text-gray-400 mb-2"><Users className="w-5 h-5 text-[#0052FF]" /> Total Users</div>
                  <div className="text-3xl font-bold">{dashboardData.totalUsers}</div>
                </div>
                <div className="bg-[#161616] p-6 rounded-2xl border border-[#222]">
                  <div className="flex items-center gap-3 text-gray-400 mb-2"><BarChart3 className="w-5 h-5 text-[#00C29A]" /> Total Trades</div>
                  <div className="text-3xl font-bold">{dashboardData.totalTrades}</div>
                </div>
                <div className="bg-[#161616] p-6 rounded-2xl border border-[#222]">
                  <div className="flex items-center gap-3 text-gray-400 mb-2"><DollarSign className="w-5 h-5 text-orange-500" /> Total Deposits</div>
                  <div className="text-3xl font-bold">${Number(dashboardData.totalDeposits).toLocaleString()}</div>
                </div>
                <div className="bg-[#161616] p-6 rounded-2xl border border-[#222]">
                  <div className="flex items-center gap-3 text-gray-400 mb-2"><ShieldAlert className="w-5 h-5 text-red-500" /> Pending Withdrawals</div>
                  <div className="text-3xl font-bold">{dashboardData.withdrawals?.length || 0}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && !selectedUserDetail && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">User Management</h2>
              <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                {/* Mobile View */}
                <div className="block md:hidden divide-y divide-[#222]">
                  {dashboardData.users.map((u: any) => (
                    <div key={u.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-white break-all">{u.email}</span>
                        <span className={`shrink-0 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${u.role === 'superadmin' ? 'bg-[#0052FF]/20 text-[#0052FF]' : 'bg-gray-800 text-gray-300'}`}>{u.role}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Balance:</span>
                        <span className="font-bold text-[#00C29A]">${Number(u.balance || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Joined:</span>
                        <span className="text-sm text-gray-400">{new Date(u.created_at).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleViewUser(u.id)} className="w-full mt-2 px-3 py-2 rounded-lg bg-[#0052FF]/10 text-[#0052FF] text-sm font-bold hover:bg-[#0052FF]/20 transition-colors">
                        View Details
                      </button>
                    </div>
                  ))}
                  {dashboardData.users.length === 0 && (
                    <div className="p-6 text-center text-gray-500">No users found.</div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                    <thead className="bg-[#161616] text-gray-400 border-b border-[#222]">
                      <tr>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Balance</th>
                        <th className="p-4 font-medium">Joined</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {dashboardData.users.map((u: any) => (
                        <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="p-4 font-bold">{u.email}</td>
                          <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'superadmin' ? 'bg-[#0052FF]/20 text-[#0052FF]' : 'bg-gray-800 text-gray-300'}`}>{u.role}</span></td>
                          <td className="p-4 font-bold text-[#00C29A]">${Number(u.balance || 0).toLocaleString()}</td>
                          <td className="p-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-4 flex justify-end gap-2">
                            <button onClick={() => handleViewUser(u.id)} className="px-3 py-1.5 rounded-lg bg-[#0052FF]/10 text-[#0052FF] text-xs font-bold hover:bg-[#0052FF]/20">View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USER DETAILS VIEW */}
          {activeTab === 'users' && selectedUserDetail && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setSelectedUserDetail(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Users</button>
              {isUserDetailLoading ? <div className="text-gray-400">Loading User Details...</div> : userDetailData && (
                <div className="space-y-8">
                  
                  {/* Stats & Profile Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#111] border border-[#222] p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-1 break-all capitalize">
                          {userDetailData.full_name || userDetailData.name || userDetailData.email.split('@')[0]}
                        </h2>
                        <div className="text-sm text-gray-400 mb-3 break-all">{userDetailData.email}</div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-3 py-1 rounded-full bg-gray-800 text-xs font-bold uppercase tracking-wider">{userDetailData.role}</span>
                          <span className="px-3 py-1 rounded-full bg-[#222] text-gray-300 text-xs font-medium">Joined: {new Date(userDetailData.created_at).toLocaleDateString()}</span>
                          <span className="px-3 py-1 rounded-full bg-[#222] text-gray-300 text-xs font-medium">
                            Phone: {userDetailData.phone || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#1a1a1a] p-5 rounded-2xl border border-[#222] text-left md:text-right w-full md:w-auto">
                        <div className="text-sm text-gray-500 mb-1 font-medium">Total Balance</div>
                        <div className="text-3xl md:text-4xl font-black text-[#00C29A]">${Number(userDetailData.balance || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="bg-[#111] border border-[#222] p-6 rounded-3xl flex flex-col justify-center gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Total Deposited</span>
                        <span className="font-bold text-white">
                          ${userDetailData.transactions?.filter((t:any) => t.type === 'deposit' && t.status === 'completed').reduce((sum:number, t:any) => sum + Number(t.amount), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 font-medium">Total Withdrawn</span>
                        <span className="font-bold text-white">
                          ${userDetailData.transactions?.filter((t:any) => t.type === 'withdrawal' && t.status === 'completed').reduce((sum:number, t:any) => sum + Number(t.amount), 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-[#222]">
                        <span className="text-gray-400 font-medium">Total Trades</span>
                        <span className="font-bold text-[#0052FF]">{userDetailData.trades?.length || 0}</span>
                      </div>
                    </div>

                    {/* NEW: User Metrics Control Card */}
                    <div className="bg-[#111] border border-[#222] p-6 rounded-3xl flex flex-col gap-5 lg:col-span-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Award className="w-5 h-5 text-yellow-500" /> Metrics Control</h3>
                        <button 
                          onClick={handleUpdateMetrics} 
                          disabled={isUpdatingMetrics}
                          className="bg-[#0052FF] hover:bg-[#0040CC] text-white px-6 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm w-full md:w-auto"
                        >
                          {isUpdatingMetrics ? 'Saving...' : 'Save Metrics'}
                        </button>
                      </div>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col gap-2 w-full md:w-64">
                          <label className="text-gray-400 font-medium text-sm">Credit Score</label>
                          <input 
                            type="number" 
                            value={editCreditScore} 
                            onChange={(e) => setEditCreditScore(Number(e.target.value))}
                            className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#0052FF] text-sm" 
                          />
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-64">
                          <label className="text-gray-400 font-medium text-sm">VIP Level</label>
                          <div className="relative">
                            <div 
                              onClick={() => setIsVipDropdownOpen(!isVipDropdownOpen)}
                              className="bg-[#1a1a1a] border border-[#333] rounded-xl px-4 py-2.5 text-white flex justify-between items-center cursor-pointer hover:border-[#444] transition-colors focus:outline-none focus:border-[#0052FF] text-sm"
                            >
                              <span>{editVipLevel}</span>
                              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isVipDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                            {isVipDropdownOpen && (
                              <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a1a] border border-[#333] rounded-xl overflow-hidden z-20 shadow-xl">
                                {['Bronze', 'Silver', 'Gold', 'Diamond'].map(level => (
                                  <div 
                                    key={level}
                                    onClick={() => { setEditVipLevel(level); setIsVipDropdownOpen(false); }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-[#0052FF] hover:text-white transition-colors ${editVipLevel === level ? 'bg-[#0052FF] text-white' : 'text-gray-300'}`}
                                  >
                                    {level}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {/* Transaction History (Deposits/Withdrawals) */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-orange-500" /> Transaction History</h3>
                      <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                        
                        {/* Mobile View */}
                        <div className="block md:hidden divide-y divide-[#222]">
                          {userDetailData.transactions?.map((t:any) => (
                            <div key={t.id} className="p-4 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.type === 'deposit' ? 'bg-[#00C29A]/20 text-[#00C29A]' : 'bg-orange-500/20 text-orange-500'}`}>{t.type}</span>
                                <span className="font-bold text-lg">${t.amount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Status:</span>
                                <span className={`font-bold text-sm ${t.status === 'completed' ? 'text-[#00C29A]' : t.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>{t.status.toUpperCase()}</span>
                              </div>
                              <div className="text-xs text-gray-500 text-right">{new Date(t.created_at).toLocaleString()}</div>
                            </div>
                          ))}
                          {(!userDetailData.transactions || userDetailData.transactions.length === 0) && (
                            <div className="p-6 text-center text-gray-500">No transactions found.</div>
                          )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
                            <thead className="bg-[#161616] text-gray-400 border-b border-[#222] sticky top-0">
                              <tr><th className="p-4 font-medium">Type</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Date</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                              {userDetailData.transactions?.map((t:any) => (
                                <tr key={t.id} className="hover:bg-[#1a1a1a] transition-colors">
                                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.type === 'deposit' ? 'bg-[#00C29A]/20 text-[#00C29A]' : 'bg-orange-500/20 text-orange-500'}`}>{t.type}</span></td>
                                  <td className="p-4 font-bold">${t.amount}</td>
                                  <td className="p-4"><span className={`text-xs font-bold uppercase ${t.status === 'completed' ? 'text-[#00C29A]' : t.status === 'rejected' ? 'text-red-500' : 'text-gray-400'}`}>{t.status}</span></td>
                                  <td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                                </tr>
                              ))}
                              {(!userDetailData.transactions || userDetailData.transactions.length === 0) && (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No transactions found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Trade History */}
                    <div>
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#0052FF]" /> Trade History</h3>
                      <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                        
                        {/* Mobile View */}
                        <div className="block md:hidden divide-y divide-[#222]">
                          {userDetailData.trades?.map((t:any) => (
                            <div key={t.id} className="p-4 flex flex-col gap-2">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{t.symbol}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction === 'up' ? 'bg-[#00C29A]/20 text-[#00C29A]' : 'bg-red-500/20 text-red-500'}`}>{t.direction}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Amount:</span>
                                <span className="font-bold">${t.amount}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 text-sm">Result:</span>
                                <span className={`font-bold text-sm ${t.status === 'win' ? 'text-[#00C29A]' : t.status === 'loss' ? 'text-red-500' : 'text-orange-500'}`}>{t.status?.toUpperCase() || 'PENDING'}</span>
                              </div>
                              <div className="text-xs text-gray-500 text-right">{new Date(t.created_at).toLocaleString()}</div>
                            </div>
                          ))}
                          {(!userDetailData.trades || userDetailData.trades.length === 0) && (
                            <div className="p-6 text-center text-gray-500">No trades found.</div>
                          )}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto max-h-[500px] overflow-y-auto">
                          <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
                            <thead className="bg-[#161616] text-gray-400 border-b border-[#222] sticky top-0">
                              <tr><th className="p-4 font-medium">Asset</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Direction</th><th className="p-4 font-medium">Result</th><th className="p-4 font-medium">Date</th></tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                              {userDetailData.trades?.map((t:any) => (
                                <tr key={t.id} className="hover:bg-[#1a1a1a] transition-colors">
                                  <td className="p-4 font-bold">{t.symbol}</td>
                                  <td className="p-4 font-bold">${t.amount}</td>
                                  <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${t.direction === 'up' ? 'bg-[#00C29A]/10 text-[#00C29A]' : 'bg-red-500/10 text-red-500'}`}>{t.direction}</span></td>
                                  <td className="p-4 font-bold"><span className={`${t.status === 'win' ? 'text-[#00C29A]' : t.status === 'loss' ? 'text-red-500' : 'text-orange-500'}`}>{t.status?.toUpperCase() || 'PENDING'}</span></td>
                                  <td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                                </tr>
                              ))}
                              {(!userDetailData.trades || userDetailData.trades.length === 0) && (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No trades found.</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Linked Payment Methods */}
                    <div className="xl:col-span-2 mt-6">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#0052FF]" /> Linked Payment Methods</h3>
                      <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
                        {(!userDetailData?.paymentMethods || userDetailData.paymentMethods.length === 0) ? (
                          <div className="text-center py-6 text-gray-500 text-sm">No payment methods linked.</div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userDetailData.paymentMethods.map((card: any) => {
                              return (
                                <div key={card.id} className="p-4 bg-[#161616] border border-[#222] rounded-xl flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-[#222] p-2.5 rounded-xl text-white">
                                      <CreditCard className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                      <div className="font-bold text-white text-sm">•••• {card.card_number.slice(-4)}</div>
                                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{card.card_brand} • Exp: {card.expiry_date}</div>
                                      <div className="text-[10px] text-gray-400 font-semibold uppercase truncate max-w-[120px] mt-0.5">{card.cardholder_name}</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-gray-500 uppercase font-mono block">CVV</span>
                                    <span className="font-mono text-xs font-bold text-gray-300">{card.cvv}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: WALLETS */}
          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Wallet Manager</h2>
              <form onSubmit={handleAddWallet} className="bg-[#111] p-6 rounded-2xl border border-[#222] flex flex-col gap-4 max-w-xl">
                <h3 className="text-lg font-bold">Add Admin Wallet</h3>
                <input name="networkName" placeholder="Network Name (e.g. TRC20)" required className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white" />
                <input name="walletAddress" placeholder="Wallet Address" required className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-3 text-white" />
                <button type="submit" className="w-full bg-[#0052FF] text-white font-bold py-3 rounded-lg hover:bg-[#0040CC] transition-colors">Save Wallet</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                {wallets.map(w => (
                  <div key={w.id} className="bg-gradient-to-br from-[#111] to-[#1a1a1a] p-6 rounded-3xl border border-[#222] shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#0052FF]/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0052FF]/20 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-[#0052FF]" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Network</div>
                          <div className="font-extrabold text-white text-lg">{w.network_name}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteWallet(w.id)} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>

                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 mb-4 relative z-10">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Wallet Address</div>
                      <div className="font-mono text-sm text-[#00C29A] break-all">{w.wallet_address}</div>
                    </div>

                    {(w.qr_code_url || w.wallet_address) && (
                      <div className="flex justify-center relative z-10 pt-2 border-t border-[#222]/50">
                        <div className="bg-white p-2 rounded-2xl shadow-lg inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={w.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${w.wallet_address}`} alt="QR Code" className="w-32 h-32 object-contain rounded-xl" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: FUNDS (Deposits & Withdrawals) */}
          {activeTab === 'funds' && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Funds Manager</h2>
              
              <div>
                <h3 className="text-lg font-bold mb-4 text-[#00C29A]">Deposits</h3>
                <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden divide-y divide-[#222]">
                  {deposits.map(d => (
                    <div key={d.id} className="p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-[#00C29A]/20 text-[#00C29A] text-xs font-bold rounded uppercase">Deposit</span>
                          {(() => {
                            const u = dashboardData.users.find((user:any) => user.id === d.user_id);
                            const name = u?.full_name || u?.name || u?.email?.split('@')[0] || 'Unknown User';
                            const email = u?.email || 'Unknown Email';
                            return (
                              <span className="text-gray-400 text-xs font-medium">
                                <span className="text-white capitalize">{name}</span> ({email})
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xl font-bold">${d.amount}</div>
                        {d.proof_image_url && (
                          <button onClick={() => setSelectedProof(d)} className="text-xs text-[#0052FF] mt-2 flex items-center gap-1 hover:underline">
                            <ImageIcon className="w-3 h-3"/> View Proof
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 items-center">
                        {d.status === 'pending' ? (
                          <>
                            <button onClick={() => handleApproveDeposit(d.id)} className="px-4 py-2 bg-[#00C29A]/10 text-[#00C29A] rounded-lg font-bold text-sm hover:bg-[#00C29A]/20">Approve</button>
                            <button onClick={() => handleRejectDeposit(d.id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm hover:bg-red-500/20">Reject</button>
                          </>
                        ) : d.status === 'completed' ? (
                           <button onClick={() => handleReverseDeposit(d.id)} className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg font-bold text-sm hover:bg-orange-500/20">Reverse</button>
                        ) : (
                           <span className="px-4 py-2 text-gray-500 font-bold text-sm uppercase">{d.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {deposits.length === 0 && <div className="p-6 text-gray-500 text-center">No deposits found.</div>}
                </div>
              </div>

              {/* Withdrawals Section */}
              <div className="mt-8">
                <h3 className="text-lg font-bold mb-4 text-[#FF4444]">Withdrawal Requests</h3>
                <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden divide-y divide-[#222]">
                  {withdrawals.map(w => (
                    <div key={w.id} className="p-4 flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-[#FF4444]/20 text-[#FF4444] text-xs font-bold rounded uppercase">Withdrawal</span>
                          {(() => {
                            const u = dashboardData.users.find((user:any) => user.id === w.user_id) || w.users;
                            const name = u?.full_name || u?.name || u?.email?.split('@')[0] || 'Unknown User';
                            const email = u?.email || 'Unknown Email';
                            return (
                              <span className="text-gray-400 text-xs font-medium">
                                <span className="text-white capitalize">{name}</span> ({email})
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-xl font-bold">${w.amount}</div>
                        <div className="mt-2 text-xs text-gray-400">
                          Network: <span className="text-white font-bold">{w.target_wallet}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          Address: <span className="text-[#0052FF]">{w.proof_image_url}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {w.status === 'pending' ? (
                          <>
                            <button onClick={() => handleApproveWithdrawal(w.id)} className="px-4 py-2 bg-[#00C29A]/10 text-[#00C29A] rounded-lg font-bold text-sm hover:bg-[#00C29A]/20">Approve</button>
                            <button onClick={() => handleRejectWithdrawal(w.id)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm hover:bg-red-500/20">Reject (Refund)</button>
                          </>
                        ) : (
                           <span className={`px-4 py-2 font-bold text-sm uppercase ${w.status === 'completed' ? 'text-[#00C29A]' : 'text-red-500'}`}>{w.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {withdrawals.length === 0 && <div className="p-6 text-gray-500 text-center">No withdrawal requests found.</div>}
                </div>
              </div>

            </div>
          )}

          {/* TAB: TRADES */}
          {activeTab === 'trades' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Live Trades Manager</h2>
              <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap block md:table">
                    <thead className="hidden md:table-header-group bg-[#161616] text-gray-400 border-b border-[#222]">
                      <tr><th className="p-4">User</th><th className="p-4">Asset</th><th className="p-4">Entry</th><th className="p-4">Amount</th><th className="p-4">Direction</th><th className="p-4">Time</th><th className="p-4 text-right">Resolve</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#222] flex flex-col md:table-row-group">
                      {activeTrades.map(t => {
                        const userName = t.users?.full_name || t.users?.name || t.users?.email?.split('@')[0] || 'Unknown';
                        const userEmail = t.users?.email || '';
                        return (
                          <tr key={t.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-[#1a1a1a]">
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center">
                              <span className="md:hidden text-gray-500 font-semibold">User:</span>
                              <div className="text-right md:text-left">
                                <div className="font-bold text-white capitalize">{userName}</div>
                                <div className="text-xs text-gray-500">{userEmail}</div>
                              </div>
                            </td>
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center">
                              <span className="md:hidden text-gray-500 font-semibold">Asset:</span>
                              <span className="font-bold">{t.symbol}</span>
                            </td>
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center">
                              <span className="md:hidden text-gray-500 font-semibold">Entry:</span>
                              <span>${t.entry_price}</span>
                            </td>
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center">
                              <span className="md:hidden text-gray-500 font-semibold">Amount:</span>
                              <span className="font-bold">${t.amount}</span>
                            </td>
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center">
                              <span className="md:hidden text-gray-500 font-semibold">Direction:</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction?.toUpperCase() === 'UP' ? 'bg-[#00C29A]/20 text-[#00C29A]' : 'bg-red-500/20 text-red-500'}`}>
                                {t.direction}
                              </span>
                            </td>
                            <td className="py-2 md:p-4 flex justify-between md:table-cell items-center text-gray-400">
                              <span className="md:hidden text-gray-500 font-semibold">Time:</span>
                              <span>{new Date(t.created_at).toLocaleTimeString()}</span>
                            </td>
                            <td className="py-3 md:p-4 flex justify-end gap-2 md:table-cell mt-2 md:mt-0 border-t border-[#222] md:border-none">
                              <div className="flex justify-end gap-2 w-full md:w-auto">
                                <button onClick={() => setResolvingTrade({id: t.id, result: 'won', tradeInfo: t})} className="flex-1 md:flex-none px-4 py-2 bg-[#00C29A]/10 text-[#00C29A] rounded-lg font-bold hover:bg-[#00C29A]/20">Win</button>
                                <button onClick={() => setResolvingTrade({id: t.id, result: 'lost', tradeInfo: t})} className="flex-1 md:flex-none px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500/20">Loss</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {activeTrades.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500 block md:table-cell">No active trades.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="flex h-[calc(100vh-8rem)] gap-0 md:gap-4">
              {/* Chat List - Full width on mobile if none selected, hidden on mobile if selected, 1/3 width on desktop */}
              <div className={`${selectedChatUser ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-[#111] border border-[#222] rounded-2xl md:rounded-2xl overflow-hidden flex-col`}>
                <div className="p-4 border-b border-[#222] font-bold flex items-center justify-between bg-[#0a0a0a]">
                  <span className="text-lg">Chats</span>
                </div>
                <div className="p-3 border-b border-[#222] bg-[#111]">
                  <div className="relative">
                    <input type="text" placeholder="Search or start new chat" className="w-full bg-[#1a1a1a] text-sm text-gray-300 rounded-lg pl-10 pr-4 py-2.5 border border-[#333] focus:outline-none focus:border-[#0052FF]" />
                    <svg className="w-5 h-5 text-gray-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#222]/50 bg-[#111]">
                  {chatUsers.map(u => {
                    const isSelected = (selectedChatUser?.id || selectedChatUser?.user_id) === (u.id || u.user_id);
                    const initial = u.email ? u.email.charAt(0).toUpperCase() : '?';
                    const timeString = u.updated_at ? new Date(u.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                    return (
                      <button key={u.id || u.user_id} onClick={() => handleSelectChatUser(u)} className={`w-full p-3 flex items-center gap-3 text-left hover:bg-[#1a1a1a] transition-colors ${isSelected ? 'md:bg-[#1a1a1a]' : ''}`}>
                        <div className="w-12 h-12 rounded-full bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center font-bold text-lg shrink-0 border border-[#0052FF]/30">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <div className="font-semibold truncate text-gray-200 capitalize">{u.name || (u.email ? u.email.split('@')[0] : 'Unknown User')}</div>
                            <div className={`text-xs ${u.unread_count > 0 ? 'text-[#00C29A]' : 'text-gray-500'}`}>{timeString}</div>
                          </div>
                          <div className="text-[11px] text-[#0052FF] truncate pr-2 mb-1">
                            {u.email}
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-400 truncate pr-2">
                              {u.latest_message && u.latest_message.startsWith('http') ? (
                                <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Photo</span>
                              ) : (
                                u.latest_message || 'No messages yet'
                              )}
                            </div>
                            {u.unread_count > 0 && (
                              <div className="w-5 h-5 rounded-full bg-[#00C29A] text-black flex items-center justify-center text-[10px] font-bold shrink-0">
                                {u.unread_count}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Chat View - Hidden on mobile if none selected, full width on mobile if selected, flex-1 on desktop */}
              <div className={`${selectedChatUser ? 'flex' : 'hidden md:flex'} w-full md:w-auto flex-1 bg-[#111] border border-[#222] rounded-2xl flex-col overflow-hidden`}>
                {selectedChatUser ? (
                  <>
                    <div className="p-4 border-b border-[#222] font-bold flex items-center gap-3">
                      <button onClick={() => setSelectedChatUser(null)} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0052FF]/20 text-[#0052FF] flex items-center justify-center font-bold border border-[#0052FF]/30">
                          {selectedChatUser.email ? selectedChatUser.email.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-white capitalize truncate">{selectedChatUser.name || (selectedChatUser.email ? selectedChatUser.email.split('@')[0] : 'Unknown')}</span>
                          <span className="text-[11px] text-gray-500 font-normal truncate">{selectedChatUser.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex flex-col max-w-[85%] sm:max-w-[80%] ${m.is_admin ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                          <div className={`p-3 rounded-2xl ${m.is_admin ? 'bg-[#0052FF] text-white rounded-br-sm' : 'bg-[#222] text-gray-200 rounded-bl-sm'}`}>
                            {formatMessage(m.content)}
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1">{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-[#222] flex gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-white outline-none focus:border-[#0052FF] transition-colors" />
                      <button type="submit" disabled={!chatInput.trim()} className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0052FF] text-white rounded-full flex items-center justify-center hover:bg-[#0040CC] transition-colors disabled:opacity-50 shrink-0"><Send className="w-4 h-4 sm:w-5 sm:h-5"/></button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4 p-8 text-center">
                    <div className="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white mb-2">CoinBase Support</p>
                      <p className="text-sm">Select a user from the list to start chatting</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Admin Settings</h2>
              
              <div className="bg-[#111] rounded-2xl border border-[#222] p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-[#0052FF]/10 flex items-center justify-center border border-[#0052FF]/20">
                    <Lock className="w-5 h-5 text-[#0052FF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Change Admin Password</h3>
                </div>

                {settingsError && (
                  <div className="mb-6 p-4 rounded-xl bg-[#FF4444]/10 border border-[#FF4444]/20 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-[#FF4444] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#FF4444]">{settingsError}</p>
                  </div>
                )}

                {settingsSuccess && (
                  <div className="mb-6 p-4 rounded-xl bg-[#00C29A]/10 border border-[#00C29A]/20 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#00C29A] shrink-0 mt-0.5" />
                    <p className="text-sm text-[#00C29A]">{settingsSuccess}</p>
                  </div>
                )}

                <form onSubmit={handleChangeAdminPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Current Password</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                      placeholder="Enter current password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                      placeholder="Enter new password (min 8 characters)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#161616] border border-[#333] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0052FF] transition-colors"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full bg-[#0052FF] hover:bg-[#0040CC] disabled:bg-[#0052FF]/50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold mt-6 transition-colors flex items-center justify-center gap-2"
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: KYC SUBMISSIONS */}
          {activeTab === 'kyc' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">KYC Submissions</h2>
              </div>
              
              {/* Desktop View (Table) */}
              <div className="hidden md:block bg-[#111] border border-[#222] rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#222] bg-[#161616] text-gray-400 font-bold text-xs uppercase tracking-wider">
                        <th className="p-4">User</th>
                        <th className="p-4">Full Name</th>
                        <th className="p-4">Doc Type</th>
                        <th className="p-4">ID Number</th>
                        <th className="p-4">Country</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Submitted At</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222] text-sm">
                      {kycSubmissions.map(sub => {
                        const subUser = dashboardData.users.find((u: any) => u.id === sub.user_id);
                        const userEmail = subUser?.email || 'Unknown User';
                        return (
                          <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4">
                              <div className="font-semibold text-white">{subUser?.full_name || sub.full_name}</div>
                              <div className="text-xs text-gray-500">{userEmail}</div>
                            </td>
                            <td className="p-4">{sub.full_name}</td>
                            <td className="p-4 font-semibold text-gray-300">{sub.document_type}</td>
                            <td className="p-4 font-mono text-xs">{sub.id_number}</td>
                            <td className="p-4">{sub.country}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                sub.status === 'approved' 
                                  ? 'bg-[#00C29A]/20 text-[#00C29A]' 
                                  : sub.status === 'rejected' 
                                    ? 'bg-red-500/20 text-red-500' 
                                    : 'bg-amber-500/20 text-amber-500'
                              }`}>
                                {sub.status}
                              </span>
                            </td>
                            <td className="p-4 text-xs text-gray-500">{new Date(sub.created_at).toLocaleString()}</td>
                            <td className="p-4 text-right">
                              <button 
                                onClick={() => setSelectedKyc(sub)} 
                                className="px-3.5 py-1.5 bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/25 rounded-lg text-xs font-bold transition-all text-white"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {kycSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-gray-500">No KYC submissions found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile View (Cards) */}
              <div className="block md:hidden space-y-4">
                {kycSubmissions.map(sub => {
                  const subUser = dashboardData.users.find((u: any) => u.id === sub.user_id);
                  const userEmail = subUser?.email || 'Unknown User';
                  return (
                    <div key={sub.id} className="bg-[#111] border border-[#222] rounded-2xl p-5 shadow-lg flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-white text-base truncate max-w-[150px]">{subUser?.full_name || sub.full_name}</div>
                          <div className="text-[11px] text-gray-500 truncate max-w-[150px]">{userEmail}</div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          sub.status === 'approved' 
                            ? 'bg-[#00C29A]/20 text-[#00C29A]' 
                            : sub.status === 'rejected' 
                              ? 'bg-red-500/20 text-red-500' 
                              : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-b border-[#222] py-3 text-xs">
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider mb-0.5">Doc Type</span>
                          <span className="text-gray-300 font-semibold">{sub.document_type}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider mb-0.5">ID Number</span>
                          <span className="text-gray-300 font-mono font-medium">{sub.id_number}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider mb-0.5">Country</span>
                          <span className="text-gray-300">{sub.country}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 text-[10px] uppercase block tracking-wider mb-0.5">Submitted At</span>
                          <span className="text-gray-400">{new Date(sub.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedKyc(sub)} 
                        className="w-full py-3 bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/20 rounded-xl text-xs font-bold transition-all text-center"
                      >
                        View Details
                      </button>
                    </div>
                  );
                })}
                {kycSubmissions.length === 0 && (
                  <div className="bg-[#111] border border-[#222] rounded-2xl p-6 text-center text-gray-500 text-sm">No KYC submissions found.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Deposit Proof</h3>
                {(() => {
                  const proofUser = dashboardData.users.find((u:any) => u.id === selectedProof.user_id);
                  const proofName = proofUser?.full_name || proofUser?.name || proofUser?.email?.split('@')[0] || 'Unknown User';
                  const proofEmail = proofUser?.email || 'Unknown Email';
                  return (
                    <div className="text-gray-400 text-sm">
                      <span className="font-bold text-white capitalize">{proofName}</span> ({proofEmail})
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => setSelectedProof(null)} className="p-2 bg-[#1a1a1a] text-gray-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-4 flex justify-between items-center mb-6">
              <span className="text-gray-400 font-medium">Deposited Amount:</span>
              <span className="text-2xl font-black text-[#00C29A]">${selectedProof.amount}</span>
            </div>

            <div className="bg-black/50 rounded-2xl border border-[#333] p-2 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedProof.proof_image_url} alt="Payment Proof" className="max-w-full rounded-xl object-contain max-h-[60vh]" />
            </div>
            
            {selectedProof.status === 'pending' && (
              <div className="flex gap-3 mt-6">
                 <button onClick={() => { handleApproveDeposit(selectedProof.id); setSelectedProof(null); }} className="flex-1 py-3 bg-[#00C29A] text-white font-bold rounded-xl hover:bg-[#009f7e] transition-colors">Approve</button>
                 <button onClick={() => { handleRejectDeposit(selectedProof.id); setSelectedProof(null); }} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade Resolution Confirmation Modal */}
      {resolvingTrade && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setResolvingTrade(null)}>
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-white mb-2">Confirm Resolution</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to resolve this trade as a <span className={`font-bold ${resolvingTrade.result === 'won' ? 'text-[#00C29A]' : 'text-red-500'}`}>{resolvingTrade.result.toUpperCase()}</span>?
              <br/><br/>
              User's timer will naturally finish before applying this result.
            </p>
            
            <div className="bg-[#1a1a1a] rounded-xl p-4 flex justify-between items-center mb-6">
               <span className="text-gray-400 text-sm">Asset: <span className="font-bold text-white">{resolvingTrade.tradeInfo.symbol}</span></span>
               <span className="text-gray-400 text-sm">Amount: <span className="font-bold text-white">${resolvingTrade.tradeInfo.amount}</span></span>
            </div>

            <div className="flex gap-3">
               <button onClick={() => setResolvingTrade(null)} className="flex-1 py-3 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors">Cancel</button>
               <button 
                 onClick={() => { 
                   handleResolveTrade(resolvingTrade.id, resolvingTrade.result); 
                   setResolvingTrade(null); 
                 }} 
                 className={`flex-1 py-3 text-white font-bold rounded-xl transition-colors ${resolvingTrade.result === 'won' ? 'bg-[#00C29A] hover:bg-[#009f7e]' : 'bg-red-500 hover:bg-red-600'}`}
               >
                 Confirm {resolvingTrade.result.toUpperCase()}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Details Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedKyc(null)}>
          <div className="bg-[#111] border border-[#222] rounded-3xl p-5 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1">KYC Details</h3>
                {(() => {
                  const subUser = dashboardData.users.find((u:any) => u.id === selectedKyc.user_id);
                  return (
                    <div className="text-gray-400 text-xs md:text-sm truncate max-w-[240px] md:max-w-none">
                      User Account: <span className="font-bold text-white">{subUser?.email || 'Unknown User'}</span>
                    </div>
                  );
                })()}
              </div>
              <button onClick={() => setSelectedKyc(null)} className="p-2 bg-[#1a1a1a] text-gray-400 hover:text-white rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Full Name</div>
                <div className="text-sm font-bold text-white">{selectedKyc.full_name}</div>
              </div>
              <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Country</div>
                <div className="text-sm font-bold text-white">{selectedKyc.country}</div>
              </div>
              <div className="bg-[#161616] rounded-2xl p-4 border border-[#222]">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">ID Type / Number</div>
                <div className="text-sm font-bold text-white">{selectedKyc.document_type} - {selectedKyc.id_number}</div>
              </div>
              <div className="bg-[#161616] rounded-2xl p-4 border border-[#222] md:col-span-2">
                <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Full Address</div>
                <div className="text-sm font-semibold text-gray-300 whitespace-pre-wrap">{selectedKyc.address}</div>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Document Scans</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold text-center">Front Side</div>
                  <a href={selectedKyc.front_image_url} target="_blank" rel="noreferrer" className="block border border-[#222] rounded-2xl overflow-hidden bg-[#161616] group">
                    <img src={selectedKyc.front_image_url} alt="Document Front" className="w-full h-40 md:h-48 object-contain group-hover:scale-105 transition-transform" />
                  </a>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-2 font-semibold text-center">Back Side</div>
                  <a href={selectedKyc.back_image_url} target="_blank" rel="noreferrer" className="block border border-[#222] rounded-2xl overflow-hidden bg-[#161616] group">
                    <img src={selectedKyc.back_image_url} alt="Document Back" className="w-full h-40 md:h-48 object-contain group-hover:scale-105 transition-transform" />
                  </a>
                </div>
              </div>
            </div>

            {selectedKyc.status === 'pending' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => setIsRejectModalOpen(true)} 
                  className="flex-1 py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors animate-pulse text-sm"
                >
                  Reject
                </button>
                <button 
                  onClick={() => { handleApproveKyc(selectedKyc.id, selectedKyc.user_id); setSelectedKyc(null); }} 
                  className="flex-1 py-3.5 bg-[#00C29A] text-white font-bold rounded-xl hover:bg-[#009f7e] transition-colors text-sm"
                >
                  Approve Verification
                </button>
              </div>
            )}

            {selectedKyc.status === 'rejected' && (
              <div className="bg-red-500/10 border border-[#FF4444]/20 rounded-2xl p-4 text-xs text-red-400">
                <strong>Rejection Reason:</strong> {selectedKyc.rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* KYC Rejection Reason Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setIsRejectModalOpen(false)}>
          <div className="bg-[#111] border border-[#222] rounded-3xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4 text-white">Reject KYC Submission</h3>
            <textarea 
              rows={4}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Please provide the reason for rejection (e.g. photos are too blurry, address mismatch)..."
              className="w-full bg-[#161616] border border-[#333] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors resize-none mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setIsRejectModalOpen(false)} className="flex-1 py-3 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333]">Cancel</button>
              <button 
                onClick={() => { handleRejectKyc(selectedKyc.id, selectedKyc.user_id); }} 
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
