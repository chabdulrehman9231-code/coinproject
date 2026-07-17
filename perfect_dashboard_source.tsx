'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, DollarSign, Activity, CheckCircle, 
  XCircle, Lock, Unlock, ShieldAlert, ChevronRight, LogOut, ArrowLeft, TrendingUp, TrendingDown, Clock, CreditCard, Award, Wallet, MessageSquare, BarChart3, Image as ImageIcon, Trash2, Send
} from 'lucide-react';
import { 
  getAdminDashboardData, getUserDetailsAdmin, 
  addAdminWallet, getAdminWallets, deleteAdminWallet,
  getDepositsAdmin, approveDeposit, rejectDeposit, reverseDeposit,
  resolveOptionTradeByAdmin, getActiveOptionTradesAdmin,
  getChatUsers, getAdminMessages, sendAdminMessage, markMessagesAsReadByAdmin
} from './actions';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const supabase = createClient();

  // Data states
  const [dashboardData, setDashboardData] = useState<any>({ users: [], totalUsers: 0, totalTrades: 0, totalDeposits: 0, withdrawals: [] });
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  
  const [wallets, setWallets] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role === 'superadmin') {
      setIsAdmin(true);
      fetchAllData();
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const fetchAllData = async () => {
    const res = await getAdminDashboardData();
    if (res.success) setDashboardData(res.data);
    const wRes = await getAdminWallets();
    if (wRes.success) setWallets(wRes.data);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data);
    const tRes = await getActiveOptionTradesAdmin();
    if (tRes.success) setActiveTrades(tRes.data);
    const cRes = await getChatUsers();
    if (cRes.success) setChatUsers(cRes.data);
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  // --- Users Actions ---
  const handleViewUser = async (userId: string) => {
    setSelectedUserDetail(userId);
    setIsUserDetailLoading(true);
    const res = await getUserDetailsAdmin(userId);
    if (res.success) setUserDetailData(res.data);
    setIsUserDetailLoading(false);
  };

  // --- Wallet Actions ---
  const handleAddWallet = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await addAdminWallet(formData);
    e.currentTarget.reset();
    const wRes = await getAdminWallets();
    if (wRes.success) setWallets(wRes.data);
  };
  const handleDeleteWallet = async (id: string) => {
    await deleteAdminWallet(id);
    const wRes = await getAdminWallets();
    if (wRes.success) setWallets(wRes.data);
  };

  // --- Funds Actions ---
  const handleApproveDeposit = async (id: string) => {
    await approveDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data);
  };
  const handleRejectDeposit = async (id: string) => {
    await rejectDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data);
  };
  const handleReverseDeposit = async (id: string) => {
    await reverseDeposit(id);
    const dRes = await getDepositsAdmin();
    if (dRes.success) setDeposits(dRes.data);
  };

  // --- Trades Actions ---
  const handleResolveTrade = async (id: string, result: 'win' | 'loss' | 'draw') => {
    await resolveOptionTradeByAdmin(id, result);
    const tRes = await getActiveOptionTradesAdmin();
    if (tRes.success) setActiveTrades(tRes.data);
  };

  // --- Chat Actions ---
  const handleSelectChatUser = async (u: any) => {
    setSelectedChatUser(u);
    await markMessagesAsReadByAdmin(u.id);
    fetchMessages(u.id);
  };
  const fetchMessages = async (userId: string) => {
    const res = await getAdminMessages(userId);
    if (res.success) {
      setChatMessages(res.data);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!chatInput.trim() || !selectedChatUser) return;
    const msg = chatInput;
    setChatInput('');
    await sendAdminMessage(selectedChatUser.id, msg);
    fetchMessages(selectedChatUser.id);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Admin...</div>;
  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-[#111] border-r border-[#222] hidden md:flex flex-col z-20">
        <div className="p-6 border-b border-[#222]">
          <h1 className="text-xl font-extrabold text-[#0052FF]">Super Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Coinbase Trades</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {[
            { id: 'overview', icon: Activity, label: 'Overview' },
            { id: 'users', icon: Users, label: 'User Management' },
            { id: 'wallets', icon: Wallet, label: 'Wallet Manager' },
            { id: 'funds', icon: DollarSign, label: 'Funds Manager' },
            { id: 'trades', icon: BarChart3, label: 'Live Trades' },
            { id: 'chat', icon: MessageSquare, label: 'Support Chat' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedUserDetail(null); }}
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
      <div className="flex-1 overflow-y-auto relative">
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
                <div className="overflow-x-auto">
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
              {isUserDetailLoading ? <div className="text-gray-400">Loading...</div> : userDetailData && (
                <div className="space-y-8">
                  <div className="bg-[#111] border border-[#222] p-8 rounded-3xl flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white mb-2">{userDetailData.email}</h2>
                      <span className="px-2 py-1 rounded-full bg-gray-800 text-xs font-bold uppercase">{userDetailData.role}</span>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#222] text-right">
                      <div className="text-sm text-gray-500 mb-1">Total Balance</div>
                      <div className="text-3xl font-bold text-[#00C29A]">${Number(userDetailData.balance || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {/* Trade History Mobile Responsive */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#0052FF]" /> Trade History</h3>
                    <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                      <div className="block md:hidden divide-y divide-[#222]">
                        {userDetailData.trades?.map((t:any) => (
                          <div key={t.id} className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center"><span className="font-bold">{t.asset}</span><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction==='up'?'bg-[#00C29A]/20 text-[#00C29A]':'bg-red-500/20 text-red-500'}`}>{t.direction}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span>${t.amount}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Result:</span><span className={`font-bold ${t.result==='win'?'text-[#00C29A]':t.result==='loss'?'text-red-500':'text-orange-500'}`}>{t.result || 'PENDING'}</span></div>
                          </div>
                        ))}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                          <thead className="bg-[#161616] text-gray-400 border-b border-[#222]"><tr><th className="p-4">Asset</th><th className="p-4">Amount</th><th className="p-4">Direction</th><th className="p-4">Result</th><th className="p-4">Date</th></tr></thead>
                          <tbody className="divide-y divide-[#222]">
                            {userDetailData.trades?.map((t:any) => (
                              <tr key={t.id} className="hover:bg-[#1a1a1a]">
                                <td className="p-4 font-bold">{t.asset}</td><td className="p-4">${t.amount}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction==='up'?'bg-[#00C29A]/20 text-[#00C29A]':'bg-red-500/20 text-red-500'}`}>{t.direction}</span></td>
                                <td className="p-4 font-bold">{t.result?.toUpperCase() || 'PENDING'}</td><td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {wallets.map(w => (
                  <div key={w.id} className="bg-[#111] p-6 rounded-2xl border border-[#222] flex justify-between items-start">
                    <div>
                      <div className="text-sm text-gray-400">{w.network_name}</div>
                      <div className="font-bold mt-1 break-all">{w.wallet_address}</div>
                    </div>
                    <button onClick={() => handleDeleteWallet(w.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"><Trash2 className="w-4 h-4"/></button>
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
                          <span className="text-gray-400 text-xs">{d.user_id}</span>
                        </div>
                        <div className="text-xl font-bold">${d.amount}</div>
                        {d.proof_image_url && <a href={d.proof_image_url} target="_blank" className="text-xs text-[#0052FF] underline mt-2 flex items-center gap-1"><ImageIcon className="w-3 h-3"/> View Proof</a>}
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

            </div>
          )}

          {/* TAB: TRADES */}
          {activeTab === 'trades' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Live Trades Manager</h2>
              <div className="bg-[#111] rounded-2xl border border-[#222] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                    <thead className="bg-[#161616] text-gray-400 border-b border-[#222]">
                      <tr><th className="p-4">Asset</th><th className="p-4">Amount</th><th className="p-4">Direction</th><th className="p-4">Time</th><th className="p-4 text-right">Resolve</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {activeTrades.map(t => (
                        <tr key={t.id} className="hover:bg-[#1a1a1a]">
                          <td className="p-4 font-bold">{t.asset}</td><td className="p-4">${t.amount}</td>
                          <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${t.direction==='up'?'bg-[#00C29A]/20 text-[#00C29A]':'bg-red-500/20 text-red-500'}`}>{t.direction}</span></td>
                          <td className="p-4 text-gray-400">{new Date(t.created_at).toLocaleTimeString()}</td>
                          <td className="p-4 flex justify-end gap-2">
                            <button onClick={() => handleResolveTrade(t.id, 'win')} className="px-3 py-1.5 bg-[#00C29A]/10 text-[#00C29A] rounded-lg font-bold hover:bg-[#00C29A]/20">Win</button>
                            <button onClick={() => handleResolveTrade(t.id, 'loss')} className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg font-bold hover:bg-red-500/20">Loss</button>
                          </td>
                        </tr>
                      ))}
                      {activeTrades.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No active trades.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="flex h-[calc(100vh-8rem)] gap-4">
              <div className="w-1/3 bg-[#111] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-[#222] font-bold">Users</div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#222]">
                  {chatUsers.map(u => (
                    <button key={u.id} onClick={() => handleSelectChatUser(u)} className={`w-full p-4 text-left hover:bg-[#1a1a1a] transition-colors ${selectedChatUser?.id === u.id ? 'bg-[#1a1a1a] border-l-2 border-[#0052FF]' : ''}`}>
                      <div className="font-bold truncate">{u.email}</div>
                      {u.unread_count > 0 && <div className="mt-1 text-xs font-bold text-[#0052FF]">{u.unread_count} Unread</div>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 bg-[#111] border border-[#222] rounded-2xl flex flex-col overflow-hidden">
                {selectedChatUser ? (
                  <>
                    <div className="p-4 border-b border-[#222] font-bold flex justify-between items-center">
                      <span>Chat with {selectedChatUser.email}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map(m => (
                        <div key={m.id} className={`flex flex-col max-w-[80%] ${m.is_admin ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                          <div className={`p-3 rounded-2xl ${m.is_admin ? 'bg-[#0052FF] text-white' : 'bg-[#222] text-gray-200'}`}>{m.content}</div>
                          <div className="text-[10px] text-gray-500 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t border-[#222] flex gap-2">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2 text-white outline-none focus:border-[#0052FF]" />
                      <button type="submit" className="p-3 bg-[#0052FF] text-white rounded-lg hover:bg-[#0040CC]"><Send className="w-5 h-5"/></button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">Select a user to start chatting</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
