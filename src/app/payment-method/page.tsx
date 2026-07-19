'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, CreditCard, Trash2, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase/client';
import { getPaymentMethods, savePaymentMethod, deletePaymentMethod } from '@/app/dashboard/actions';

// Inline beautiful SVG logos for credit card brands
const VisaLogo = ({ className = "w-12 h-8" }: { className?: string }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 36 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.626 0.306L9.124 11.233H6.182L3.743 2.45C3.593 1.849 3.13 1.343 2.502 1.014C1.905 0.7 0.887 0.38 0 0.198L0.062 0.003H5.039C5.666 0.003 6.223 0.407 6.357 1.034L7.57 7.027L10.669 0.308L13.626 0.306ZM25.568 7.828C25.58 4.962 21.734 4.8 21.761 3.42C21.774 3.003 22.181 2.553 23.056 2.433C23.49 2.373 24.685 2.316 25.59 2.748L26.12 0.38C25.395 0.12 24.475 0 23.36 0C20.528 0 18.528 1.488 18.508 3.633C18.47 5.21 19.897 6.092 20.978 6.613C22.088 7.148 22.459 7.49 22.451 7.971C22.433 8.706 21.554 9.034 20.732 9.034C19.277 9.034 18.432 8.623 17.765 8.318L17.214 10.748C17.882 11.052 19.117 11.314 20.395 11.32C23.385 11.32 25.548 9.852 25.568 7.828ZM32.88 0.306L30.297 11.233H27.502L24.918 0.306H27.87L29.625 8.16L31.393 0.306H32.88ZM18.066 0.306L15.358 11.233H12.6L15.308 0.306H18.066Z" fill="#ffffff" />
  </svg>
);

const MastercardLogo = ({ className = "w-10 h-7" }: { className?: string }) => (
  <svg className={`${className} shrink-0`} viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7.5" r="7" fill="#EB001B" />
    <circle cx="17" cy="7.5" r="7" fill="#F79E1B" fillOpacity="0.8" />
  </svg>
);

const AmexLogo = ({ className = "w-10 h-7" }: { className?: string }) => (
  <div className={`${className} bg-[#007cc3] text-white font-black text-[9px] flex items-center justify-center rounded-[3px] tracking-tighter uppercase shrink-0 border border-white/10`}>
    AMEX
  </div>
);

const DiscoverLogo = ({ className = "w-11 h-7" }: { className?: string }) => (
  <div className={`${className} bg-gradient-to-r from-[#ff6000] to-[#ff8400] text-white font-bold text-[8px] flex flex-col items-center justify-center rounded-[3px] tracking-tight uppercase shrink-0 border border-white/10`}>
    <span>DISCOVER</span>
  </div>
);

export default function PaymentMethodPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardBrand, setCardBrand] = useState('unknown');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // UI Processing states
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  // Fetch active user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchCards(user.id);
      } else {
        router.push('/login');
      }
    }
    getUser();
  }, []);

  const fetchCards = async (uid: string) => {
    setLoading(true);
    const res = await getPaymentMethods(uid);
    if (res.success && res.data) {
      setPaymentMethods(res.data);
    }
    setLoading(false);
  };

  // Card Brand Detection Logic based on prefix
  const detectCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s+/g, '');
    if (!cleanNumber) return 'unknown';

    if (cleanNumber.startsWith('4')) {
      return 'visa';
    }
    if (/^(5[1-5]|2[2-7])/.test(cleanNumber)) {
      return 'mastercard';
    }
    if (/^(34|37)/.test(cleanNumber)) {
      return 'amex';
    }
    if (/^(6011|65|64[4-9])/.test(cleanNumber)) {
      return 'discover';
    }
    return 'unknown';
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Keep numbers only
    if (input.length > 16) input = input.slice(0, 16); // Limit to 16 digits

    // Format with spaces
    const parts = [];
    for (let i = 0; i < input.length; i += 4) {
      parts.push(input.substring(i, i + 4));
    }
    const formatted = parts.join(' ');
    setCardNumber(formatted);
    setCardBrand(detectCardBrand(formatted));
  };

  // Format Expiry Date (MM/YY format, adds slash automatically)
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Keep numbers only
    if (input.length > 4) input = input.slice(0, 4);

    if (input.length >= 2) {
      const month = input.substring(0, 2);
      const year = input.substring(2);
      
      // Basic month validation
      let formattedMonth = month;
      if (parseInt(month, 10) > 12) formattedMonth = '12';
      if (parseInt(month, 10) === 0 && month.length === 2) formattedMonth = '01';

      setExpiryDate(`${formattedMonth}/${year}`);
    } else {
      setExpiryDate(input);
    }
  };

  // Format CVV (digits only, max 4 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '');
    if (input.length <= 4) {
      setCvv(input);
    }
  };

  // Submit new payment method
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      setError('Please enter a valid credit card number.');
      return;
    }
    if (expiryDate.length < 5) {
      setError('Expiry date must be in MM/YY format.');
      return;
    }
    if (cvv.length < 3) {
      setError('Security code (CVV) is too short.');
      return;
    }

    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('cardholderName', cardholderName.toUpperCase());
    formData.append('cardNumber', cardNumber);
    formData.append('cardBrand', cardBrand);
    formData.append('expiryDate', expiryDate);
    formData.append('cvv', cvv);

    try {
      const res = await savePaymentMethod(formData);
      setSubmitting(false);

      if (res.success) {
        setIsModalOpen(false);
        // Clear fields
        setCardholderName('');
        setCardNumber('');
        setCardBrand('unknown');
        setExpiryDate('');
        setCvv('');
        fetchCards(userId);
      } else {
        setError(res.error || 'Failed to save payment method.');
      }
    } catch (err: any) {
      setSubmitting(false);
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  // Delete payment method
  const handleDeleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to remove this payment method?')) return;
    setDeletingId(cardId);
    try {
      const res = await deletePaymentMethod(cardId, userId);
      if (res.success) {
        fetchCards(userId);
      } else {
        alert(res.error || 'Failed to delete card.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred.');
    }
    setDeletingId('');
  };

  // Helper to render card brand icon in list
  const renderCardLogo = (brand: string) => {
    switch (brand) {
      case 'visa': return <VisaLogo className="w-10 h-7" />;
      case 'mastercard': return <MastercardLogo className="w-10 h-7" />;
      case 'amex': return <AmexLogo className="w-10 h-7" />;
      case 'discover': return <DiscoverLogo className="w-10 h-7" />;
      default: return <CreditCard className="w-10 h-7 text-gray-500" />;
    }
  };

  // Helper to return beautiful gradient depending on brand
  const getCardGradient = (brand: string) => {
    switch (brand) {
      case 'visa':
        return 'bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] border border-blue-900/50';
      case 'mastercard':
        return 'bg-gradient-to-br from-[#111111] via-[#242424] to-[#111111] border border-neutral-800';
      case 'amex':
        return 'bg-gradient-to-br from-[#065f46] via-[#0f766e] to-[#115e59] border border-teal-900/50';
      case 'discover':
        return 'bg-gradient-to-br from-[#7c2d12] via-[#9a3412] to-[#7c2d12] border border-orange-950/50';
      default:
        return 'bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#09090b] border border-zinc-800';
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
              className="p-2 bg-[#111] border border-[#222] hover:bg-[#1a1a1a] rounded-xl text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Payment Methods</h1>
              <p className="text-xs text-gray-500">Manage credit & debit cards linked to your account</p>
            </div>
          </div>

          {/* Secure details bar */}
          <div className="bg-[#BF953F]/5 border border-[#BF953F]/10 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-[#BF953F]" />
            <div className="text-[11px] text-gray-400 leading-normal">
              Payment processing is secure and PCI-DSS compliant. Card details are fully encrypted and protected.
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BF953F]" />
              <div className="text-xs text-gray-500">Loading payment methods...</div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Saved Cards List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Saved Cards</h2>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#BF953F] hover:bg-[#9E7B35] rounded-lg text-xs font-bold transition-all text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Card
                  </button>
                </div>

                {paymentMethods.length === 0 ? (
                  <div className="bg-[#111] border border-[#222] border-dashed rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-4">
                    <div className="p-4 bg-[#161616] rounded-full text-gray-500">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-1">No payment methods linked</h3>
                      <p className="text-xs text-gray-500 max-w-[240px] mx-auto leading-relaxed">Attach a credit or debit card to fund options trading and balances instantly.</p>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="px-5 py-2.5 bg-[#BF953F]/10 text-[#BF953F] hover:bg-[#BF953F]/20 rounded-xl text-xs font-bold transition-all"
                    >
                      Attach Card Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {paymentMethods.map((card) => (
                      <div 
                        key={card.id}
                        className={`p-4 rounded-2xl relative shadow-md flex items-center justify-between transition-transform duration-300 hover:scale-[1.01] ${getCardGradient(card.card_brand)}`}
                      >
                        <div className="flex items-center gap-4">
                          {renderCardLogo(card.card_brand)}
                          <div>
                            <div className="text-sm font-bold text-white tracking-wide">
                              •••• •••• •••• {card.card_number.slice(-4)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase mt-0.5">
                              {card.cardholder_name} • {card.expiry_date}
                            </div>
                          </div>
                        </div>

                        <button 
                          disabled={deletingId === card.id}
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500/25 border border-red-500/10 text-red-500 rounded-xl transition-all disabled:opacity-50 shrink-0"
                          title="Remove card"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Add Card Modal (Facebook / Google style fullscreen panel) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-[#111] border-t sm:border border-[#222] rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto my-0 sm:my-8 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white">Add Card</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-[#1a1a1a] text-gray-400 hover:text-white rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Virtual Card Live Preview (Metallic style) */}
            <div className="mb-6">
              <div className={`w-full aspect-[1.58/1] rounded-2xl p-5 flex flex-col justify-between shadow-2xl transition-all duration-500 ${getCardGradient(cardBrand)}`}>
                <div className="flex justify-between items-start">
                  {/* Microchip */}
                  <div className="w-9 h-7 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 rounded-md shadow-inner relative overflow-hidden">
                    <div className="absolute inset-x-2 top-0 bottom-0 border-l border-r border-black/10" />
                    <div className="absolute inset-y-1.5 left-0 right-0 border-t border-b border-black/10" />
                  </div>
                  {/* Detected Brand Logo */}
                  {cardBrand === 'visa' && <VisaLogo />}
                  {cardBrand === 'mastercard' && <MastercardLogo />}
                  {cardBrand === 'amex' && <AmexLogo />}
                  {cardBrand === 'discover' && <DiscoverLogo />}
                  {cardBrand === 'unknown' && <CreditCard className="w-8 h-8 text-white/50" />}
                </div>

                {/* Card Number */}
                <div className="text-white text-lg font-mono tracking-[0.18em] my-3">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>

                <div className="flex justify-between items-end">
                  {/* Holder Name */}
                  <div className="max-w-[70%]">
                    <span className="text-[8px] text-white/40 uppercase block tracking-wider font-semibold">Cardholder Name</span>
                    <span className="text-xs font-bold text-white tracking-wide uppercase truncate block max-w-full">
                      {cardholderName || 'CARDHOLDER NAME'}
                    </span>
                  </div>

                  {/* Expiry Date */}
                  <div className="text-right">
                    <span className="text-[8px] text-white/40 uppercase block tracking-wider font-semibold">Expires</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {expiryDate || 'MM/YY'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl p-3.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Cardholder Name</label>
                <input 
                  type="text"
                  required
                  value={cardholderName}
                  onChange={e => setCardholderName(e.target.value.toUpperCase())}
                  placeholder="John Doe"
                  className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Card Number</label>
                <div className="relative">
                  <input 
                    type="text"
                    required
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="4000 1234 5678 9010"
                    className="w-full bg-[#161616] border border-[#222] rounded-xl pl-4 pr-14 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors font-mono tracking-wider"
                  />
                  {/* Dynamic Brand Logo inside Card Number Input Field */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                    {cardBrand === 'visa' && <VisaLogo className="w-8 h-5" />}
                    {cardBrand === 'mastercard' && <MastercardLogo className="w-8 h-5" />}
                    {cardBrand === 'amex' && <AmexLogo className="w-8 h-5" />}
                    {cardBrand === 'discover' && <DiscoverLogo className="w-8 h-5" />}
                    {cardBrand === 'unknown' && <CreditCard className="w-5 h-5 text-gray-600" />}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Expiry Date</label>
                  <input 
                    type="text"
                    required
                    value={expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/YY"
                    className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">CVV / CVC</label>
                  <input 
                    type="password"
                    required
                    value={cvv}
                    onChange={handleCvvChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full bg-[#161616] border border-[#222] rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#BF953F] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-[#222] text-white font-bold rounded-xl hover:bg-[#333] transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-[#BF953F] hover:bg-[#9E7B35] disabled:bg-[#BF953F]/50 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  {submitting ? 'Linking...' : 'Link Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
