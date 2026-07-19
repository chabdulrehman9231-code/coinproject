'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertTriangle, X, ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { submitKycRequest, getKycStatus } from '@/app/dashboard/actions';

const COUNTRIES = [
  { name: "Afghanistan", code: "af" },
  { name: "Albania", code: "al" },
  { name: "Algeria", code: "dz" },
  { name: "Andorra", code: "ad" },
  { name: "Angola", code: "ao" },
  { name: "Argentina", code: "ar" },
  { name: "Armenia", code: "am" },
  { name: "Australia", code: "au" },
  { name: "Austria", code: "at" },
  { name: "Azerbaijan", code: "az" },
  { name: "Bahamas", code: "bs" },
  { name: "Bahrain", code: "bh" },
  { name: "Bangladesh", code: "bd" },
  { name: "Barbados", code: "bb" },
  { name: "Belarus", code: "by" },
  { name: "Belgium", code: "be" },
  { name: "Belize", code: "bz" },
  { name: "Benin", code: "bj" },
  { name: "Bhutan", code: "bt" },
  { name: "Bolivia", code: "bo" },
  { name: "Bosnia and Herzegovina", code: "ba" },
  { name: "Botswana", code: "bw" },
  { name: "Brazil", code: "br" },
  { name: "Brunei", code: "bn" },
  { name: "Bulgaria", code: "bg" },
  { name: "Burkina Faso", code: "bf" },
  { name: "Burundi", code: "bi" },
  { name: "Cambodia", code: "kh" },
  { name: "Cameroon", code: "cm" },
  { name: "Canada", code: "ca" },
  { name: "Central African Republic", code: "cf" },
  { name: "Chad", code: "td" },
  { name: "Chile", code: "cl" },
  { name: "China", code: "cn" },
  { name: "Colombia", code: "co" },
  { name: "Comoros", code: "km" },
  { name: "Congo", code: "cg" },
  { name: "Costa Rica", code: "cr" },
  { name: "Croatia", code: "hr" },
  { name: "Cuba", code: "cu" },
  { name: "Cyprus", code: "cy" },
  { name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" },
  { name: "Djibouti", code: "dj" },
  { name: "Dominica", code: "dm" },
  { name: "Dominican Republic", code: "do" },
  { name: "Ecuador", code: "ec" },
  { name: "Egypt", code: "eg" },
  { name: "El Salvador", code: "sv" },
  { name: "Equatorial Guinea", code: "gq" },
  { name: "Eritrea", code: "er" },
  { name: "Estonia", code: "ee" },
  { name: "Eswatini", code: "sz" },
  { name: "Ethiopia", code: "et" },
  { name: "Fiji", code: "fj" },
  { name: "Finland", code: "fi" },
  { name: "France", code: "fr" },
  { name: "Gabon", code: "ga" },
  { name: "Gambia", code: "gm" },
  { name: "Georgia", code: "ge" },
  { name: "Germany", code: "de" },
  { name: "Ghana", code: "gh" },
  { name: "Greece", code: "gr" },
  { name: "Grenada", code: "gd" },
  { name: "Guatemala", code: "gt" },
  { name: "Guinea", code: "gn" },
  { name: "Guyana", code: "gy" },
  { name: "Haiti", code: "ht" },
  { name: "Honduras", code: "hn" },
  { name: "Hungary", code: "hu" },
  { name: "Iceland", code: "is" },
  { name: "India", code: "in" },
  { name: "Indonesia", code: "id" },
  { name: "Iran", code: "ir" },
  { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" },
  { name: "Israel", code: "il" },
  { name: "Italy", code: "it" },
  { name: "Jamaica", code: "jm" },
  { name: "Japan", code: "jp" },
  { name: "Jordan", code: "jo" },
  { name: "Kazakhstan", code: "kz" },
  { name: "Kenya", code: "ke" },
  { name: "Kiribati", code: "ki" },
  { name: "Kuwait", code: "kw" },
  { name: "Kyrgyzstan", code: "kg" },
  { name: "Laos", code: "la" },
  { name: "Latvia", code: "lv" },
  { name: "Lebanon", code: "lb" },
  { name: "Lesotho", code: "ls" },
  { name: "Liberia", code: "lr" },
  { name: "Libya", code: "ly" },
  { name: "Liechtenstein", code: "li" },
  { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" },
  { name: "Madagascar", code: "mg" },
  { name: "Malawi", code: "mw" },
  { name: "Malaysia", code: "my" },
  { name: "Maldives", code: "mv" },
  { name: "Mali", code: "ml" },
  { name: "Malta", code: "mt" },
  { name: "Mauritania", code: "mr" },
  { name: "Mauritius", code: "mu" },
  { name: "Mexico", code: "mx" },
  { name: "Moldova", code: "md" },
  { name: "Monaco", code: "mc" },
  { name: "Mongolia", code: "mn" },
  { name: "Montenegro", code: "me" },
  { name: "Morocco", code: "ma" },
  { name: "Mozambique", code: "mz" },
  { name: "Myanmar", code: "mm" },
  { name: "Namibia", code: "na" },
  { name: "Nepal", code: "np" },
  { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" },
  { name: "Nicaragua", code: "ni" },
  { name: "Niger", code: "ne" },
  { name: "Nigeria", code: "ng" },
  { name: "North Korea", code: "kp" },
  { name: "North Macedonia", code: "mk" },
  { name: "Norway", code: "no" },
  { name: "Oman", code: "om" },
  { name: "Pakistan", code: "pk" },
  { name: "Palau", code: "pw" },
  { name: "Palestine", code: "ps" },
  { name: "Panama", code: "pa" },
  { name: "Papua New Guinea", code: "pg" },
  { name: "Paraguay", code: "py" },
  { name: "Peru", code: "pe" },
  { name: "Philippines", code: "ph" },
  { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" },
  { name: "Qatar", code: "qa" },
  { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" },
  { name: "Rwanda", code: "rw" },
  { name: "Samoa", code: "ws" },
  { name: "San Marino", code: "sm" },
  { name: "Saudi Arabia", code: "sa" },
  { name: "Senegal", code: "sn" },
  { name: "Serbia", code: "rs" },
  { name: "Seychelles", code: "sc" },
  { name: "Sierra Leone", code: "sl" },
  { name: "Singapore", code: "sg" },
  { name: "Slovakia", code: "sk" },
  { name: "Slovenia", code: "si" },
  { name: "Somalia", code: "so" },
  { name: "South Africa", code: "za" },
  { name: "South Korea", code: "kr" },
  { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" },
  { name: "Sudan", code: "sd" },
  { name: "Sweden", code: "se" },
  { name: "Switzerland", code: "ch" },
  { name: "Syria", code: "sy" },
  { name: "Taiwan", code: "tw" },
  { name: "Tajikistan", code: "tj" },
  { name: "Tanzania", code: "tz" },
  { name: "Thailand", code: "th" },
  { name: "Timor-Leste", code: "tl" },
  { name: "Togo", code: "tg" },
  { name: "Trinidad and Tobago", code: "tt" },
  { name: "Tunisia", code: "tn" },
  { name: "Turkey", code: "tr" },
  { name: "Turkmenistan", code: "tm" },
  { name: "Uganda", code: "ug" },
  { name: "Ukraine", code: "ua" },
  { name: "United Arab Emirates", code: "ae" },
  { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" },
  { name: "Uruguay", code: "uy" },
  { name: "Uzbekistan", code: "uz" },
  { name: "Vanuatu", code: "vu" },
  { name: "Venezuela", code: "ve" },
  { name: "Vietnam", code: "vn" },
  { name: "Yemen", code: "ye" },
  { name: "Zambia", code: "zm" },
  { name: "Zimbabwe", code: "zw" }
];

export default function KycPage() {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [kycState, setKycState] = useState<{ status: string; submission: any }>({ status: 'unverified', submission: null });

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [documentType, setDocumentType] = useState('National ID');
  
  // File Upload State
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        fetchKycStatus(user.id);
      } else {
        router.push('/login');
      }
    });
  }, [supabase, router]);

  const fetchKycStatus = async (uid: string) => {
    setLoading(true);
    const res = await getKycStatus(uid);
    if (res.success) {
      setKycState({ status: res.status, submission: res.submission });
    }
    setLoading(false);
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!country) {
      setError('Please select your country.');
      return;
    }
    if (!frontFile || !backFile) {
      setError('Please upload both the front and back side images of your identity document.');
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('fullName', fullName);
    formData.append('country', country);
    formData.append('idNumber', idNumber);
    formData.append('address', address);
    formData.append('documentType', documentType);
    formData.append('frontFile', frontFile);
    formData.append('backFile', backFile);

    try {
      const res = await submitKycRequest(formData);
      setSubmitting(false);

      if (res.success) {
        setSuccess(true);
        fetchKycStatus(userId);
      } else {
        setError(res.error || 'Failed to submit KYC request.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'An unexpected network error occurred. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-white">
      <Header />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto w-full pt-4 md:pt-8 px-4">
          
          {/* Header with back button */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => router.back()} 
              className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">KYC Identity Verification</h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-4 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500">Checking verification status...</p>
            </div>
          ) : success || kycState.status === 'pending' ? (
            /* Pending Review View */
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
                <Upload className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Verification Under Review</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Your identity verification documents have been submitted successfully and are currently pending review. 
                Our compliance team will review your data shortly.
              </p>
              <div className="bg-[#161616] rounded-2xl p-4 border border-[#222] text-left">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Submitted Details</div>
                <div className="text-sm text-white font-semibold mb-1">{kycState.submission?.full_name}</div>
                <div className="text-xs text-gray-400">{kycState.submission?.document_type} ({kycState.submission?.id_number})</div>
              </div>
            </div>
          ) : kycState.status === 'approved' ? (
            /* Approved View */
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 text-center shadow-xl">
              <div className="w-16 h-16 rounded-full bg-[#00C29A]/10 flex items-center justify-center mx-auto mb-5 border border-[#00C29A]/20">
                <CheckCircle2 className="w-8 h-8 text-[#00C29A]" />
              </div>
              <h3 className="text-xl font-bold text-[#00C29A] mb-2">Account Verified</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Congratulations! Your identity has been verified successfully. Your account limits and access are now fully upgraded.
              </p>
            </div>
          ) : (
            /* Unverified or Rejected Form View */
            <div className="flex flex-col gap-6">
              
              {kycState.status === 'rejected' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex gap-3.5">
                  <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Verification Rejected</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Your previous verification request was rejected. Reason: <span className="text-red-400 font-semibold">{kycState.submission?.rejection_reason || 'Incomplete or unclear documentation.'}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-2">Please re-submit your accurate details and clear ID photos below.</p>
                  </div>
                </div>
              )}

              <div className="bg-[#111] rounded-3xl p-6 border border-[#222] shadow-xl">
                <h3 className="text-base font-bold text-white mb-5">Personal Information</h3>
                
                {error && (
                  <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="As listed on your official ID card"
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Country</label>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between bg-[#161616] border border-[#222] rounded-xl px-4 py-3.5 text-left text-white focus:outline-none focus:border-[#BF953F] transition-all hover:bg-[#1a1a1a]"
                      >
                        <span className="flex items-center gap-2.5 text-sm">
                          {country ? (
                            <>
                              <img 
                                src={`https://flagcdn.com/w40/${COUNTRIES.find(c => c.name === country)?.code.toLowerCase()}.png`} 
                                alt={country} 
                                className="w-5 h-3.5 object-cover rounded-[2px] border border-white/10 shrink-0"
                              />
                              <span>{country}</span>
                            </>
                          ) : (
                            <span className="text-gray-500">Select Country</span>
                          )}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-2 bg-[#161616] border border-[#222] rounded-2xl shadow-2xl overflow-hidden z-20 w-full flex flex-col">
                          {/* Search box inside dropdown */}
                          <div className="p-2 border-b border-[#222] bg-[#161616]">
                            <input 
                              type="text" 
                              placeholder="Search country..."
                              value={searchQuery}
                              onChange={e => setSearchQuery(e.target.value)}
                              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#BF953F] transition-all"
                            />
                          </div>
                          
                          {/* List of countries */}
                          <div className="max-h-52 overflow-y-auto divide-y divide-[#222]">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => {
                                  setCountry(c.name);
                                  setIsDropdownOpen(false);
                                  setSearchQuery('');
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm hover:bg-white/[0.04] transition-colors ${country === c.name ? 'bg-[#BF953F]/10 text-[#BF953F] font-bold' : 'text-gray-200'}`}
                              >
                                <img 
                                  src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`} 
                                  alt={c.name} 
                                  className="w-5 h-3.5 object-cover rounded-[2px] border border-white/10 shrink-0" 
                                />
                                <span>{c.name}</span>
                              </button>
                            ))}
                            {filteredCountries.length === 0 && (
                              <div className="p-4 text-center text-xs text-gray-500">No countries found.</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">ID Number</label>
                      <input 
                        type="text" 
                        required
                        value={idNumber}
                        onChange={e => setIdNumber(e.target.value)}
                        placeholder="ID Card / Passport No."
                        className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Full Residential Address</label>
                    <textarea 
                      required
                      rows={2}
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Street, City, Zip Code"
                      className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Identity Document Type</label>
                    <div className="flex gap-2.5">
                      {['National ID', 'Passport', 'License'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDocumentType(type)}
                          className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${documentType === type ? 'bg-[#BF953F] border-[#BF953F] text-white' : 'bg-[#161616] border-[#222] text-gray-400 hover:border-gray-700'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ID Upload Boxes */}
                  <div className="space-y-4 pt-4 border-t border-[#222]">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Document Photos</h4>

                    {/* Front side upload */}
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Front Side of Document</span>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#222] hover:border-gray-700 rounded-2xl p-4 cursor-pointer min-h-[140px] bg-[#161616] transition-colors overflow-hidden">
                        {frontPreview ? (
                          <img src={frontPreview} alt="Front preview" className="max-h-[120px] rounded-lg object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="w-6 h-6 text-gray-500 mb-2" />
                            <span className="text-xs font-semibold text-gray-300">Click to upload photo</span>
                            <span className="text-[10px] text-gray-500 mt-1">PNG, JPG, JPEG</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFrontFileChange}
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Back side upload */}
                    <div>
                      <span className="block text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">Back Side of Document</span>
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#222] hover:border-gray-700 rounded-2xl p-4 cursor-pointer min-h-[140px] bg-[#161616] transition-colors overflow-hidden">
                        {backPreview ? (
                          <img src={backPreview} alt="Back preview" className="max-h-[120px] rounded-lg object-contain" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">
                            <Upload className="w-6 h-6 text-gray-500 mb-2" />
                            <span className="text-xs font-semibold text-gray-300">Click to upload photo</span>
                            <span className="text-[10px] text-gray-500 mt-1">PNG, JPG, JPEG</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleBackFileChange}
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#BF953F] hover:bg-[#9E7B35] disabled:bg-[#BF953F]/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all mt-6 text-sm flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit Verification Details'
                    )}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      </main>

      <BottomNav />
    </div>
  );
}
