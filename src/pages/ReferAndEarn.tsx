
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Share2, Users, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface Referral {
    id: string;
    referred_user_id: string;
    status: string;
    referrer_reward_given: boolean;
    created_at: string;
    referred_name?: string;
}

const ReferAndEarn = () => {
    const { t } = useLanguage();
    const { user, profile } = useAuth();
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Use actual referral code from profile
    const referralCode = profile?.referral_code || '...';
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
        }
        setLoading(false);
    };

    const handleCopy = () => {
        if (!referralCode || referralCode === '...') return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success(t('Referral code copied!', 'रेफरल कोड कॉपी किया गया!'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!referralCode || referralCode === '...') return;
        const shareText = t(
            `Join me on Vanshmala to preserve our family history! Use my code ${referralCode}. Sign up here: ${referralLink}`,
            `वंशमाला पर मेरे साथ जुड़ें और हमारे परिवार के इतिहास को संजोएं! मेरे कोड ${referralCode} का उपयोग करें। यहाँ साइन अप करें: ${referralLink}`
        );

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Vanshmala',
                    text: shareText,
                    url: referralLink,
                });
            } catch (err) {
                // Share cancelled
            }
        } else {
            navigator.clipboard.writeText(shareText);
            toast.success(t('Referral link copied to clipboard!', 'रेफरल लिंक क्लिपबोर्ड पर कॉपी किया गया!'));
        }
    };

    const handleWhatsAppShare = () => {
        const shareText = encodeURIComponent(t(
            `Join me on Vanshmala to preserve our family history! Use my code ${referralCode}. Sign up here: ${referralLink}`,
            `वंशमाला पर मेरे साथ जुड़ें और हमारे परिवार के इतिहास को संजोएं! मेरे कोड ${referralCode} का उपयोग करें। यहाँ साइन अप करें: ${referralLink}`
        ));
        window.open(`https://wa.me/?text=${shareText}`, '_blank');
    };

    const totalEarned = referrals.filter(r => r.referrer_reward_given).length * 11;
    const pendingRewards = referrals.filter(r => r.status !== 'completed').length * 11;

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-gradient-to-b from-saffron/10 to-background pt-8 pb-12 px-4">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-saffron/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-saffron/5 rounded-full blur-3xl" />

                <div className="container max-w-4xl mx-auto relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron/20 text-saffron-900 text-sm font-medium mb-4">
                            <Gift className="w-4 h-4" />
                            {t('Give ₹11, Get ₹11', '₹11 दें, ₹11 पाएं')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-saffron-950 mb-4 tracking-tight">
                            {t('Refer Your Family', 'अपने परिवार को रेफर करें')}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                            {t(
                                'Invite your family members to build your tree together. You both earn ₹11 when they join and start their journey.',
                                'अपने परिवार के सदस्यों को एक साथ अपना कुलवृक्ष बनाने के लिए आमंत्रित करें। जब वे शामिल होते हैं और अपनी यात्रा शुरू करते हैं, तो आप दोनों को ₹11 मिलते हैं।'
                            )}
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container max-w-4xl mx-auto px-4 -mt-8 space-y-6">
                {/* Main Action Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-none shadow-xl shadow-saffron/5 overflow-hidden">
                        <div className="bg-gradient-saffron p-6 md:p-8 text-primary-foreground">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div className="text-center md:text-left">
                                    <p className="text-primary-foreground/80 font-medium mb-1">
                                        {t('Your Referral Code', 'आपका रेफरल कोड')}
                                    </p>
                                    <div className="text-4xl md:text-5xl font-mono font-bold tracking-[0.2em] md:tracking-[0.3em] brightness-125">
                                        {referralCode}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 w-full md:w-auto">
                                    <Button
                                        onClick={handleWhatsAppShare}
                                        className="bg-green-500 hover:bg-green-600 text-white font-bold h-14 px-8 rounded-2xl shadow-lg shadow-green-500/20 text-lg group"
                                    >
                                        <MessageSquare className="mr-2 h-6 w-6 group-hover:scale-110 transition-transform" />
                                        {t('Share on WhatsApp', 'वाट्सएप पर साझा करें')}
                                    </Button>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={handleCopy}
                                            className="flex-1 h-12 rounded-xl"
                                        >
                                            <Copy className="mr-2 h-4 w-4" />
                                            {t('Copy Code', 'कोड कॉपी करें')}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            onClick={handleShare}
                                            className="flex-1 h-12 rounded-xl"
                                        >
                                            <Share2 className="mr-2 h-4 w-4" />
                                            {t('Other Apps', 'अन्य ऐप्स')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Rewards Summary */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                                <Gift className="w-5 h-5 text-saffron" />
                                {t('Your Rewards', 'आपके पुरस्कार')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="p-4 rounded-2xl bg-saffron/5 border border-saffron/10">
                                    <div className="text-3xl font-bold text-saffron mb-1">₹{totalEarned}</div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('Earned', 'कमाए गए')}</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted border border-border">
                                    <div className="text-3xl font-bold text-muted-foreground mb-1">₹{pendingRewards}</div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('Pending', 'लंबित')}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* How it works */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                {t('How it works', 'यह कैसे काम करता है')}
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { text: t('Share your unique code', 'अपना अनूठा कोड साझा करें'), hi: 'अपना विशेष कोड साझा करें' },
                                    { text: t('They sign up (They get ₹11)', 'वे साइन अप करें (उन्हें ₹11 मिलेंगे)'), hi: 'वे साइन अप करें (उन्हें ₹11 मिलेंगे)' },
                                    { text: t('They join a family (You get ₹11)', 'वे परिवार से जुड़ें (आपको ₹11 मिलेंगे)'), hi: 'वे परिवार से जुड़ें (आपको ₹11 मिलेंगे)' },
                                ].map((step, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-medium">{step.text}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Referral History */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            {t('Referral History', 'रेफरल इतिहास')}
                        </h3>

                        {loading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron"></div>
                            </div>
                        ) : referrals.length === 0 ? (
                            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-border bg-muted/30">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
                                <p className="text-muted-foreground font-medium">
                                    {t('No referrals yet. Start sharing to earn!', 'अभी कोई रेफरल नहीं है। कमाई शुरू करने के लिए साझा करना शुरू करें!')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {referrals.map((ref, i) => (
                                        <motion.div
                                            key={ref.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex items-center justify-between p-4 rounded-xl bg-card border border-border group hover:border-saffron/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ref.status === 'completed'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {ref.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{ref.referred_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-sm font-bold ${ref.referrer_reward_given ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {ref.referrer_reward_given ? '+₹11' : '₹11 Pending'}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold tracking-tighter opacity-50">
                                                    {ref.status}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReferAndEarn;
