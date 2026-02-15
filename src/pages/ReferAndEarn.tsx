
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

const ReferAndEarn = () => {
    const { t } = useLanguage();
    const { user, profile } = useAuth();
    const [copied, setCopied] = useState(false);

    // Use actual referral code from profile
    const referralCode = profile?.referral_code || '...';

    const handleCopy = () => {
        if (!referralCode || referralCode === '...') return;
        navigator.clipboard.writeText(referralCode);
        setCopied(true);
        toast.success(t('Referral code copied!', 'रेफरल कोड कॉपी किया गया!'));
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (!referralCode || referralCode === '...') return;
        const shareUrl = `${window.location.origin}/register?ref=${referralCode}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join Vanshmala',
                    text: `Join me on Vanshmala to preserve our family history! Use my code ${referralCode}. Sign up here:`,
                    url: shareUrl,
                });
            } catch (err) {
                // Share cancelled or failed
            }
        } else {
            navigator.clipboard.writeText(`${t('Join Vanshmala', 'वंशमाला से जुड़ें')}: ${shareUrl}`);
            toast.success(t('Referral link copied to clipboard!', 'रेफरल लिंक क्लिपबोर्ड पर कॉपी किया गया!'));
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-display font-bold text-saffron-900 mb-4">
                    {t('Refer & Earn', 'रेफर करें और कमाएं')}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {t(
                        'Invite your family members to Vanshmala and earn rewards while preserving your heritage together.',
                        'अपने परिवार के सदस्यों को वंशमाला में आमंत्रित करें और अपनी विरासत को संरक्षित करते हुए पुरस्कार अर्जित करें।'
                    )}
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card className="bg-gradient-to-br from-saffron/5 to-transparent border-saffron/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Gift className="h-6 w-6 text-saffron" />
                            {t('Your Rewards', 'आपके पुरस्कार')}
                        </CardTitle>
                        <CardDescription>
                            {t('Track your earnings and rewards.', 'अपनी कमाई और पुरस्कारों को ट्रैक करें।')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <div className="text-5xl font-bold text-saffron mb-2">₹0</div>
                            <p className="text-muted-foreground">{t('Total Earned', 'कुल कमाई')}</p>
                        </div>
                        <div className="space-y-4 mt-4">
                            <div className="flex justify-between items-center p-3 bg-white/50 rounded-lg border">
                                <span className="text-sm font-medium">{t('Pending Rewards', 'लंबित पुरस्कार')}</span>
                                <span className="font-bold">₹0</span>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Share2 className="h-6 w-6 text-blue-600" />
                            {t('Invite Friends', 'दोस्तों को आमंत्रित करें')}
                        </CardTitle>
                        <CardDescription>
                            {t('Share your unique code with family and friends.', 'अपने परिवार और दोस्तों के साथ अपना अनूठा कोड साझा करें।')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('Your Referral Code', 'आपका रेफरल कोड')}</label>
                            <div className="flex gap-2">
                                <div className="flex-1 h-12 bg-muted rounded-lg flex items-center justify-center font-mono text-lg font-bold border border-dashed border-primary/30 tracking-wider">
                                    {referralCode}
                                </div>
                                <Button variant="outline" size="icon" className="h-12 w-12" onClick={handleCopy}>
                                    <Copy className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        <Button className="w-full bg-gradient-saffron hover:opacity-90 text-lg h-12" onClick={handleShare}>
                            <Share2 className="mr-2 h-5 w-5" />
                            {t('Share Now', 'अभी साझा करें')}
                        </Button>

                        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                            <p className="font-semibold mb-1">{t('How it works:', 'यह कैसे काम करता है:')}</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>{t('Share your code with relatives.', 'रिश्तेदारों के साथ अपना कोड साझा करें।')}</li>
                                <li>{t('They sign up and create/join a family tree.', 'वे साइन अप करते हैं और एक कुलवृक्ष बनाते/शामिल होते हैं।')}</li>
                                <li>{t('You both earn rewards!', 'आप दोनों पुरस्कार कमाते हैं!')}</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ReferAndEarn;
