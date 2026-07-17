const fs = require('fs');
let content = fs.readFileSync('temp_original_admin.tsx', 'utf8');

// 1. Add ArrowLeft icon and SelectedUserDetail states
content = content.replace(
  /XCircle, Lock, Unlock, ShieldAlert, ChevronRight, LogOut/,
  'XCircle, Lock, Unlock, ShieldAlert, ChevronRight, LogOut, ArrowLeft'
);
content = content.replace(
  /import \{ useRouter \} from 'next\\/navigation';/,
  "import { useRouter } from 'next/navigation';\nimport { getUserDetailsAdmin } from './actions';"
);

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('overview'\);/,
  `const [activeTab, setActiveTab] = useState('overview');
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [isUserDetailLoading, setIsUserDetailLoading] = useState(false);
  
  const handleViewUser = async (userId: string) => {
    setSelectedUserDetail(userId);
    setIsUserDetailLoading(true);
    const res = await getUserDetailsAdmin(userId);
    if (res.success) setUserDetailData(res.data);
    setIsUserDetailLoading(false);
  };
  `
);

// 2. Hide specific tabs when user detail is active
content = content.replace(
  /\{activeTab === 'overview' && \(/,
  "{activeTab === 'overview' && !selectedUserDetail && ("
);
content = content.replace(
  /\{activeTab === 'users' && \(/,
  "{activeTab === 'users' && !selectedUserDetail && ("
);
content = content.replace(
  /onClick=\{\(\) => setActiveTab\('overview'\)\}/g,
  "onClick={() => { setActiveTab('overview'); setSelectedUserDetail(null); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveTab\('users'\)\}/g,
  "onClick={() => { setActiveTab('users'); setSelectedUserDetail(null); }}"
);
content = content.replace(
  /onClick=\{\(\) => setActiveTab\('funds'\)\}/g,
  "onClick={() => { setActiveTab('funds'); setSelectedUserDetail(null); }}"
);

// 3. Update the Users Table to be responsive and add View Details action
content = content.replace(
  /<button className="px-3 py-1\.5 rounded bg-\[\#0052FF\]\/10 hover:bg-\[\#0052FF\]\/20 text-\[\#0052FF\] text-xs font-bold transition-colors">\s+Edit Balance\s+<\/button>/,
  `<button className="px-3 py-1.5 rounded bg-[#0052FF]/10 hover:bg-[#0052FF]/20 text-[#0052FF] text-xs font-bold transition-colors">
                              Edit Balance
                            </button>
                            <button onClick={() => handleViewUser(u.id)} className="px-3 py-1.5 rounded bg-[#00C29A]/10 hover:bg-[#00C29A]/20 text-[#00C29A] text-xs font-bold transition-colors">
                              View Details
                            </button>`
);
content = content.replace(
  /<table className="w-full text-left text-sm">/,
  '<table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">'
);

// 4. Add the User Details View block right after the Users Tab
content = content.replace(
  /\{\/\* TAB: FUNDS \*\/\}/,
  `{/* USER DETAILS VIEW */}
          {activeTab === 'users' && selectedUserDetail && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button onClick={() => setSelectedUserDetail(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"><ArrowLeft className="w-4 h-4" /> Back to Users</button>
              {isUserDetailLoading ? <div className="text-gray-400">Loading...</div> : userDetailData && (
                <div className="space-y-8">
                  <div className="bg-[#161616] border border-white/5 p-8 rounded-3xl flex justify-between items-center">
                    <div>
                      <h2 className="text-3xl font-extrabold text-white mb-2">{userDetailData.email}</h2>
                      <span className="px-2 py-1 rounded-full bg-gray-800 text-xs font-bold uppercase">{userDetailData.role}</span>
                    </div>
                    <div className="bg-[#111] p-4 rounded-2xl border border-[#222] text-right">
                      <div className="text-sm text-gray-500 mb-1">Total Balance</div>
                      <div className="text-3xl font-bold text-[#00C29A]">\${Number(userDetailData.balance || 0).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {/* Trade History Mobile Responsive */}
                  <div>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-[#0052FF]" /> Trade History</h3>
                    <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
                      <div className="block md:hidden divide-y divide-[#222]">
                        {userDetailData.trades?.map((t:any) => (
                          <div key={t.id} className="p-4 flex flex-col gap-2">
                            <div className="flex justify-between items-center"><span className="font-bold">{t.asset}</span><span className={\`px-2 py-1 rounded text-xs font-bold uppercase \${t.direction==='up'?'bg-[#00C29A]/20 text-[#00C29A]':'bg-red-500/20 text-red-500'}\`}>{t.direction}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Amount:</span><span>\${t.amount}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Result:</span><span className={\`font-bold \${t.result==='win'?'text-[#00C29A]':t.result==='loss'?'text-red-500':'text-orange-500'}\`}>{t.result || 'PENDING'}</span></div>
                          </div>
                        ))}
                        {(!userDetailData.trades || userDetailData.trades.length === 0) && <div className="p-6 text-gray-500 text-center">No trades found.</div>}
                      </div>
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                          <thead className="bg-[#111] text-gray-400 border-b border-[#222]"><tr><th className="p-4">Asset</th><th className="p-4">Amount</th><th className="p-4">Direction</th><th className="p-4">Result</th><th className="p-4">Date</th></tr></thead>
                          <tbody className="divide-y divide-[#222]">
                            {userDetailData.trades?.map((t:any) => (
                              <tr key={t.id} className="hover:bg-[#1a1a1a]">
                                <td className="p-4 font-bold">{t.asset}</td><td className="p-4">\${t.amount}</td>
                                <td className="p-4"><span className={\`px-2 py-1 rounded text-xs font-bold uppercase \${t.direction==='up'?'bg-[#00C29A]/20 text-[#00C29A]':'bg-red-500/20 text-red-500'}\`}>{t.direction}</span></td>
                                <td className="p-4 font-bold">{t.result?.toUpperCase() || 'PENDING'}</td><td className="p-4 text-gray-500">{new Date(t.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                            {(!userDetailData.trades || userDetailData.trades.length === 0) && <tr><td colSpan={5} className="p-6 text-gray-500 text-center">No trades found.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: FUNDS */}`
);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Restored original UI and integrated responsive tables');
