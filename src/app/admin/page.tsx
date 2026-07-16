'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, DollarSign, Activity, CheckCircle, 
  XCircle, Lock, Unlock, ShieldAlert, ChevronRight, LogOut 
} from 'lucide-react';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
    fetchUsers();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role === 'superadmin') {
      setIsAdmin(true);
    } else {
      router.push('/dashboard');
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    // Note: If RLS is enabled, the superadmin role might need explicit policies to read all users.
    // For this prototype, we're fetching public users.
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-[#0a0a0a] text-white">Loading Admin...</div>;
  }

  if (!isAdmin) return null;

  // Mock pending transactions for the Funds Management tab
  const mockTransactions = [
    { id: 'TRX-9821', type: 'Deposit', amount: '500.00 USDT', user: 'ahmed@example.com', status: 'Pending' },
    { id: 'TRX-9822', type: 'Withdrawal', amount: '120.00 USDT', user: 'ali@example.com', status: 'Pending' },
  ];

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
      
      {/* Sidebar Navigation (Desktop First approach, but responsive) */}
      <div className="w-64 bg-[#111] border-r border-[#222] hidden md:flex flex-col">
        <div className="p-6 border-b border-[#222]">
          <h1 className="text-xl font-extrabold text-[#0052FF]">Super Admin</h1>
          <p className="text-xs text-gray-500 mt-1">Coinbase Trrades</p>
        </div>
        <nav className="flex-1 py-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-[#0052FF]/10 text-[#0052FF] border-r-2 border-[#0052FF]' : 'text-gray-400 hover:text-white'}`}
          >
            <Activity className="w-5 h-5" /> Overview
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-[#0052FF]/10 text-[#0052FF] border-r-2 border-[#0052FF]' : 'text-gray-400 hover:text-white'}`}
          >
            <Users className="w-5 h-5" /> User Management
          </button>
          <button 
            onClick={() => setActiveTab('funds')}
            className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'funds' ? 'bg-[#0052FF]/10 text-[#0052FF] border-r-2 border-[#0052FF]' : 'text-gray-400 hover:text-white'}`}
          >
            <DollarSign className="w-5 h-5" /> Funds Manager
          </button>
        </nav>
        <div className="p-4 border-t border-[#222]">
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-red-400 font-medium text-sm">
            <LogOut className="w-4 h-4" /> Exit Admin
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-[#222] flex items-center justify-between bg-[#111]">
          <h1 className="text-lg font-bold text-[#0052FF]">Admin Panel</h1>
          <button onClick={handleLogout} className="text-red-500"><LogOut className="w-5 h-5" /></button>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden flex border-b border-[#222] bg-[#111] overflow-x-auto scrollbar-hide text-sm">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 whitespace-nowrap ${activeTab === 'overview' ? 'text-[#0052FF] border-b-2 border-[#0052FF]' : 'text-gray-400'}`}>Overview</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-3 whitespace-nowrap ${activeTab === 'users' ? 'text-[#0052FF] border-b-2 border-[#0052FF]' : 'text-gray-400'}`}>Users</button>
          <button onClick={() => setActiveTab('funds')} className={`px-4 py-3 whitespace-nowrap ${activeTab === 'funds' ? 'text-[#0052FF] border-b-2 border-[#0052FF]' : 'text-gray-400'}`}>Funds</button>
        </div>

        <div className="p-4 md:p-8">
          
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <Users className="w-5 h-5 text-[#0052FF]" /> Total Users
                  </div>
                  <div className="text-3xl font-bold">{users.length}</div>
                </div>
                
                <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <DollarSign className="w-5 h-5 text-[#00C29A]" /> Platform Assets
                  </div>
                  <div className="text-3xl font-bold">$125,430.00</div>
                  <div className="text-xs text-gray-500 mt-1">Mocked Data</div>
                </div>

                <div className="bg-[#161616] p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 text-gray-400 mb-2">
                    <ShieldAlert className="w-5 h-5 text-orange-500" /> Pending Approvals
                  </div>
                  <div className="text-3xl font-bold">2</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">User Management</h2>
              <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#111] text-gray-400 border-b border-[#222]">
                      <tr>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Role</th>
                        <th className="p-4 font-medium">Joined</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-[#1a1a1a] transition-colors">
                          <td className="p-4 text-gray-200">{u.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'superadmin' ? 'bg-[#0052FF]/20 text-[#0052FF]' : 'bg-gray-800 text-gray-300'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                          <td className="p-4 flex justify-end gap-2">
                            <button className="p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors" title="Lock Account">
                              <Lock className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1.5 rounded bg-[#0052FF]/10 hover:bg-[#0052FF]/20 text-[#0052FF] text-xs font-bold transition-colors">
                              Edit Balance
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">No users found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: FUNDS */}
          {activeTab === 'funds' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Funds Manager</h2>
              
              <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-4 bg-[#111] border-b border-[#222]">
                  <h3 className="font-bold text-gray-300">Pending Requests</h3>
                </div>
                <div className="divide-y divide-[#222]">
                  {mockTransactions.map((trx) => (
                    <div key={trx.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1a1a1a] transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${trx.type === 'Deposit' ? 'bg-[#00C29A]/20 text-[#00C29A]' : 'bg-orange-500/20 text-orange-500'}`}>
                            {trx.type}
                          </span>
                          <span className="text-gray-500 text-xs">{trx.id}</span>
                        </div>
                        <div className="text-lg font-bold">{trx.amount}</div>
                        <div className="text-sm text-gray-400">User: {trx.user}</div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#00C29A]/10 text-[#00C29A] hover:bg-[#00C29A]/20 rounded-lg text-sm font-bold transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
