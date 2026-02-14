import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Gift, Users, Copy, Check, Clock, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  referrer_reward_given: boolean;
  created_at: string;
  completed_at: string | null;
  referred_name?: string;
}

const ReferralsPage = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [totalRewards, setTotalRewards] = useState(0);

  const referralCode = profile?.referral_code || '';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    if (user) fetchReferrals();
  }, [user]);

  const fetchReferrals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch referred user names
      const userIds = data.map((r: any) => r.referred_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      const enriched = data.map((r: any) => ({
        ...r,
        referred_name: profileMap.get(r.referred_user_id) || 'User',
      }));

      setReferrals(enriched);
      setTotalRewards(enriched.filter((r: any) => r.referrer_reward_given).length * 11);
    }
    setLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t('Referral link copied!', 'रेफरल लिंक कॉपी हो गया!'));
    setTimeout(() => setCopied(false), 2000);
  };

  const pendingCount = referrals.filter(r => r.status === 'pending').length;
  const completedCount = referrals.filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">

          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-gradient-saffron text-primary-foreground shadow-saffron mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8" />
              <h1 className="font-display text-2xl font-bold">{t('Refer & Earn', 'रेफर करें और कमाएं')}</h1>
            </div>
            <p className="text-sm opacity-80 mb-4">
              {t(
                'Earn ₹11 for every friend who joins a family. Your friend gets ₹11 instantly!',
                'हर उस दोस्त के लिए ₹11 कमाएं जो परिवार से जुड़ता है। आपके दोस्त को तुरंत ₹11 मिलते हैं!'
              )}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/10">
                <div className="text-2xl font-bold">{referrals.length}</div>
                <div className="text-xs opacity-70">{t('Total', 'कुल')}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <div className="text-2xl font-bold">{completedCount}</div>
                <div className="text-xs opacity-70">{t('Completed', 'पूर्ण')}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10">
                <div className="text-2xl font-bold">₹{totalRewards}</div>
                <div className="text-xs opacity-70">{t('Earned', 'कमाए')}</div>
              </div>
            </div>
          </motion.div>

          {/* Referral Code */}
          <div className="p-5 rounded-2xl bg-card border border-border mb-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-3">
              {t('Your Referral Code', 'आपका रेफरल कोड')}
            </h3>
            <div className="flex gap-2">
              <Input value={referralCode} readOnly className="font-mono text-lg font-bold text-center" />
              <Button onClick={handleCopy} variant="outline" size="icon">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-2">{t('Or share this link:', 'या यह लिंक शेयर करें:')}</p>
              <div className="flex gap-2">
                <Input value={referralLink} readOnly className="text-xs" />
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {t('Copy', 'कॉपी')}
                </Button>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-5 rounded-2xl bg-card border border-border mb-8">
            <h3 className="font-display text-lg font-semibold text-foreground mb-4">
              {t('How it works', 'कैसे काम करता है')}
            </h3>
            <div className="space-y-3">
              {[
                { step: '1', en: 'Share your referral code with friends', hi: 'अपना रेफरल कोड दोस्तों के साथ शेयर करें' },
                { step: '2', en: 'They sign up using your code → Get ₹11 instantly', hi: 'वे आपके कोड से साइन अप करें → तुरंत ₹11 मिलें' },
                { step: '3', en: 'When they create/join a family → You get ₹11', hi: 'जब वे परिवार बनाएं/जुड़ें → आपको ₹11 मिलें' },
              ].map(({ step, en, hi }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-saffron/10 text-saffron flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {step}
                  </div>
                  <p className="font-body text-sm text-foreground">{t(en, hi)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referred Users List */}
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('Referred Users', 'रेफर किए गए उपयोगकर्ता')}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <span className="text-saffron/40 text-2xl animate-pulse">ॐ</span>
              </div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
                <Gift className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-body text-muted-foreground">
                  {t('No referrals yet. Share your code!', 'अभी कोई रेफरल नहीं। अपना कोड शेयर करें!')}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((ref) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        ref.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        {ref.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">{ref.referred_name}</p>
                        <p className="font-body text-xs text-muted-foreground">
                          {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ref.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ref.status === 'completed'
                          ? t('₹11 Earned', '₹11 कमाया')
                          : t('Pending', 'लंबित')}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ReferralsPage;
