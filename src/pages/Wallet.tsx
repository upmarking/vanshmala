import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

import { motion } from 'framer-motion';
import { Wallet, Plus, Send, ArrowDownLeft, ArrowUpRight, Gift, History, Tag } from 'lucide-react';
import GiftCardDialog from '@/components/wallet/GiftCardDialog';
import DiscountCodeInput from '@/components/wallet/DiscountCodeInput';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface WalletData {
  id: string;
  user_id: string;
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  description_hi: string | null;
  reference_type: string | null;
  created_at: string;
}

const WalletPage = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showGiftCard, setShowGiftCard] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [processing, setProcessing] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ amount: number; codeId: string; code: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  const fetchWallet = async () => {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user!.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Wallet doesn't exist, create one
      const { data: newWallet } = await supabase
        .from('wallets')
        .insert({ user_id: user!.id, balance: 0 })
        .select()
        .single();
      if (newWallet) setWallet(newWallet as any);
    } else if (data) {
      setWallet(data as any);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setTransactions(data as any);
  };

  const handleAddMoney = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount < 1) {
      toast.error(t('Enter a valid amount (min ₹1)', 'एक मान्य राशि दर्ज करें (न्यूनतम ₹1)'));
      return;
    }

    setProcessing(true);

    // Calculate payment amount (with discount if applied)
    const payAmount = appliedDiscount ? amount - appliedDiscount.amount : amount;
    const discountInfo = appliedDiscount ? { ...appliedDiscount } : null;

    try {
      // Create Razorpay order via edge function
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const supabaseBase = import.meta.env.VITE_SUPABASE_URL ?? 'https://api.vanshmala.in';
      const orderRes = await fetch(
        `${supabaseBase}/functions/v1/razorpay-wallet`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'create_order', amount: payAmount > 0 ? payAmount : amount }),
        }
      );

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        toast.error(t('Failed to create payment order', 'भुगतान ऑर्डर बनाने में विफल'));
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: (payAmount > 0 ? payAmount : amount) * 100,
        currency: 'INR',
        name: 'Vanshmala',
        description: t('Add money to Dhan wallet', 'धन वॉलेट में पैसे जोड़ें'),
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // Verify payment server-side
          const verifyRes = await fetch(
            `${supabaseBase}/functions/v1/razorpay-wallet`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                action: 'verify_payment',
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                bonus_amount: discountInfo?.amount || 0,
              }),
            }
          );

          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            // If discount was applied, record usage and credit bonus
            if (discountInfo) {
              await supabase.from('discount_code_usage' as any).insert({
                discount_code_id: discountInfo.codeId,
                user_id: user!.id,
                amount_added: amount,
                discount_amount: discountInfo.amount,
              });
              // Update discount code usage count
              await supabase.rpc('validate_discount_code' as any, {
                p_code: discountInfo.code,
                p_amount: amount,
                p_user_id: user!.id,
              });
            }
            toast.success(t(`₹${amount} added to wallet!`, `₹${amount} वॉलेट में जोड़े गए!`));
            setShowAddMoney(false);
            setAddAmount('');
            setAppliedDiscount(null);
            fetchWallet();
            fetchTransactions();
          } else {
            toast.error(t('Payment verification failed', 'भुगतान सत्यापन विफल'));
          }
        },
        prefill: {
          email: user?.email || '',
          contact: profile?.phone || '',
        },
        theme: { color: '#D97706' },
      };

      if (typeof (window as any).Razorpay !== 'undefined') {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        toast.error(t('Razorpay not loaded. Please refresh.', 'Razorpay लोड नहीं हुआ। कृपया रिफ्रेश करें।'));
      }
    } catch (err) {
      toast.error(t('Payment failed', 'भुगतान विफल'));
    }
    setProcessing(false);
  };

  const handleTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!amount || amount < 1) {
      toast.error(t('Enter valid amount', 'मान्य राशि दर्ज करें'));
      return;
    }
    if (!transferTarget.trim()) {
      toast.error(t('Enter Vanshmala ID or Phone', 'वंशमाला ID या फ़ोन दर्ज करें'));
      return;
    }
    if (!wallet || wallet.balance < amount) {
      toast.error(t('Insufficient balance', 'अपर्याप्त शेष राशि'));
      return;
    }

    setProcessing(true);

    // Find recipient by vanshmala_id or phone
    const { data: recipient } = await supabase
      .from('profiles')
      .select('user_id, full_name, vanshmala_id')
      .or(`vanshmala_id.eq.${transferTarget.trim()},phone.eq.${transferTarget.trim()}`)
      .single();

    if (!recipient) {
      toast.error(t('Recipient not found', 'प्राप्तकर्ता नहीं मिला'));
      setProcessing(false);
      return;
    }

    if (recipient.user_id === user!.id) {
      toast.error(t('Cannot transfer to yourself', 'स्वयं को ट्रांसफर नहीं कर सकते'));
      setProcessing(false);
      return;
    }

    // Get recipient wallet
    const { data: recipientWallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', recipient.user_id)
      .single();

    if (!recipientWallet) {
      toast.error(t('Recipient wallet not found', 'प्राप्तकर्ता वॉलेट नहीं मिला'));
      setProcessing(false);
      return;
    }

    // Debit sender
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id);

    await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        user_id: user!.id,
        type: 'debit',
        amount,
        description: `Transfer to ${recipient.full_name} (${recipient.vanshmala_id})`,
        description_hi: `${recipient.full_name} (${recipient.vanshmala_id}) को भेजे`,
        reference_type: 'transfer',
        reference_id: recipient.user_id,
      });

    // Credit recipient — use RPC or service role in production
    // For now, direct update (requires RLS to allow, which it does for own wallet)
    // We'll use an edge function for proper transfer in production
    try {
      await supabase.rpc('process_wallet_transfer' as any, {
        p_recipient_user_id: recipient.user_id,
        p_amount: amount,
        p_sender_name: profile?.full_name || 'User',
        p_sender_vanshmala_id: profile?.vanshmala_id || '',
      });
    } catch {
      // Edge function will handle this in production
    }

    toast.success(t(`₹${amount} sent to ${recipient.full_name}!`, `₹${amount} ${recipient.full_name} को भेजे!`));
    setShowTransfer(false);
    setTransferAmount('');
    setTransferTarget('');
    fetchWallet();
    fetchTransactions();
    setProcessing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in-up">
      {/* Hero Balance Card — full bleed on mobile */}
      <div className="mx-0 md:container md:mx-auto md:max-w-2xl md:pt-8 md:px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 md:rounded-2xl bg-gradient-saffron text-primary-foreground shadow-saffron mb-1 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2 md:mb-4">
            <Wallet className="w-7 h-7 md:w-8 md:h-8" />
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold">{t('Dhan', 'धन')} 💰</h1>
              <p className="text-xs md:text-sm opacity-80">{t('Your Vanshmala Wallet', 'आपका वंशमाला वॉलेट')}</p>
            </div>
          </div>
          <div className="text-5xl md:text-4xl font-bold font-display mb-5 tracking-tight">
            ₹{loading ? '—' : (wallet?.balance || 0).toFixed(2)}
          </div>

          {/* Quick action chips — Android style */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setShowAddMoney(true)}
              className="flex flex-col items-center gap-1 min-w-[72px] py-2.5 px-3 rounded-2xl bg-white/20 text-primary-foreground active:bg-white/30 transition-colors"
            >
              <Plus size={20} />
              <span className="text-[11px] font-medium whitespace-nowrap">{t('Add', 'जोड़ें')}</span>
            </button>
            <button
              onClick={() => setShowTransfer(true)}
              className="flex flex-col items-center gap-1 min-w-[72px] py-2.5 px-3 rounded-2xl bg-white/20 text-primary-foreground active:bg-white/30 transition-colors"
            >
              <Send size={20} />
              <span className="text-[11px] font-medium whitespace-nowrap">{t('Send', 'भेजें')}</span>
            </button>
            <button
              onClick={() => setShowGiftCard(true)}
              className="flex flex-col items-center gap-1 min-w-[72px] py-2.5 px-3 rounded-2xl bg-white/20 text-primary-foreground active:bg-white/30 transition-colors"
            >
              <Gift size={20} />
              <span className="text-[11px] font-medium whitespace-nowrap">{t('Gift', 'गिफ्ट')}</span>
            </button>
            <button
              onClick={() => navigate('/refer')}
              className="flex flex-col items-center gap-1 min-w-[72px] py-2.5 px-3 rounded-2xl bg-white/20 text-primary-foreground active:bg-white/30 transition-colors"
            >
              <ArrowUpRight size={20} />
              <span className="text-[11px] font-medium whitespace-nowrap">{t('Refer', 'रेफर')}</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Transaction History */}
      <div className="container mx-auto px-4 max-w-2xl pb-4">
        {/* Desktop quick links (hidden on mobile — chips above serve this) */}
        <div className="hidden md:flex gap-3 mb-6">
          <Button variant="outline" onClick={() => setShowGiftCard(true)} className="flex-1 gap-2">
            <Gift className="w-4 h-4" />{t('Gift Card', 'गिफ्ट कार्ड')}
          </Button>
          <Button variant="outline" onClick={() => navigate('/refer')} className="flex-1 gap-2">
            <Gift className="w-4 h-4" />{t('Refer & Earn', 'रेफर करें और कमाएं')}
          </Button>
        </div>

        <div>
          <h2 className="font-display text-lg md:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <History className="w-5 h-5" />
            {t('Transaction History', 'लेन-देन इतिहास')}
          </h2>

          {transactions.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
              <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-body text-muted-foreground">
                {t('No transactions yet', 'अभी कोई लेन-देन नहीं')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn) => (
                <motion.div
                  key={txn.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between py-3.5 px-4 rounded-xl bg-card border border-border min-h-[56px]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'credit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                      {txn.type === 'credit' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-body text-sm font-medium text-foreground leading-tight">
                        {t(txn.description, txn.description_hi || txn.description)}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {formatDate(txn.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`font-display font-semibold text-sm shrink-0 ${txn.type === 'credit' ? 'text-green-600' : 'text-destructive'
                    }`}>
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>


        {/* Add Money Dialog */}
        <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Add Money', 'पैसे जोड़ें')}</DialogTitle>
              <DialogDescription>{t('Add funds to your Dhan wallet via Razorpay', 'Razorpay से अपने धन वॉलेट में पैसे जोड़ें')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                {[100, 500, 1000].map((amt) => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => setAddAmount(String(amt))}>
                    ₹{amt}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => { setAddAmount(e.target.value); setAppliedDiscount(null); }}
                placeholder={t('Enter amount', 'राशि दर्ज करें')}
                min="1"
              />
              <DiscountCodeInput
                amount={parseFloat(addAmount) || 0}
                onDiscountApplied={setAppliedDiscount}
              />
              {appliedDiscount && (
                <div className="text-sm text-muted-foreground">
                  {t('You pay: ', 'आप भुगतान करें: ')}
                  <span className="font-semibold text-foreground">₹{((parseFloat(addAmount) || 0) - appliedDiscount.amount).toFixed(2)}</span>
                  <span className="line-through ml-2">₹{addAmount}</span>
                  {' '}{t('+ bonus ₹', '+ बोनस ₹')}{appliedDiscount.amount.toFixed(2)}
                </div>
              )}
              <Button onClick={handleAddMoney} disabled={processing} className="w-full bg-gradient-saffron text-primary-foreground">
                {processing ? t('Processing...', 'प्रोसेस हो रहा है...') : t('Pay with Razorpay', 'Razorpay से भुगतान करें')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Transfer Money', 'पैसे भेजें')}</DialogTitle>
              <DialogDescription>{t('Send money using Vanshmala ID or Phone Number', 'वंशमाला ID या फ़ोन नंबर से पैसे भेजें')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                placeholder={t('Vanshmala ID or Phone', 'वंशमाला ID या फ़ोन')}
              />
              <Input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder={t('Amount (₹)', 'राशि (₹)')}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                {t('Balance: ', 'शेष: ')}₹{wallet?.balance?.toFixed(2) || '0.00'}
              </p>
              <Button onClick={handleTransfer} disabled={processing} className="w-full bg-gradient-saffron text-primary-foreground">
                {processing ? t('Sending...', 'भेज रहे हैं...') : t('Send', 'भेजें')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gift Card Dialog */}
        <GiftCardDialog
          open={showGiftCard}
          onOpenChange={setShowGiftCard}
          walletBalance={wallet?.balance || 0}
          onSuccess={() => { fetchWallet(); fetchTransactions(); }}
        />

      </div>
    </div>
  );
};

export default WalletPage;
