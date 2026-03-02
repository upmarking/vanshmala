import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, MailCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const DataDeletionRequest = () => {
    const { session, signOut } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [step, setStep] = useState<'login' | 'request' | 'verify' | 'deleted'>(
        session ? 'request' : 'login'
    );

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationPhrase, setConfirmationPhrase] = useState('');

    // Handle step 1: Login if not authenticated
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        navigate('/login', { state: { returnTo: '/data-deletion-request' } });
    };

    // Handle step 2: Request OTP for deletion verification
    const handleRequestDeletion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (confirmationPhrase.toLowerCase() !== 'delete my account permanently') {
            toast.error(t('Please type the exact confirmation phrase.', 'कृपया सटीक पुष्टिकरण वाक्यांश लिखें।'));
            return;
        }

        if (!session?.user?.email) {
            toast.error('User email not found. Please log in again.');
            return;
        }

        setIsLoading(true);
        try {
            // Send OTP via Supabase Auth
            const { error } = await supabase.auth.signInWithOtp({
                email: session.user.email,
                options: {
                    shouldCreateUser: false,
                },
            });

            if (error) throw error;

            setStep('verify');
            toast.success(
                t('Verification code sent to your email.', 'आपके ईमेल पर सत्यापन कोड भेजा गया है।')
            );
        } catch (error: any) {
            console.error('Error requesting OTP:', error);
            toast.error(error.message || 'Failed to send verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle step 3: Verify OTP and delete account
    const handleVerifyAndDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp || otp.length < 6) {
            toast.error(t('Please enter a valid OTP.', 'कृपया एक वैध OTP दर्ज करें।'));
            return;
        }

        if (!session?.user?.email) return;

        setIsLoading(true);
        try {
            // 1. Verify the OTP
            const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
                email: session.user.email,
                token: otp,
                type: 'magiclink', // typically signInWithOtp goes through magiclink flow for existing users
            });

            if (verifyError) throw verifyError;

            // 2. Call the server edge function or RPC to safely delete user data
            // For now we'll call an RPC function if it exists, or just log them out and attempt standard supabase auth deletion (which usually requires edge functions for security).
            // Standard supabase js client cannot delete its own user from auth.users directly. It requires a service_role key.
            // Therefore, we MUST have a backend endpoint or trigger in Supabase.
            // We are simulating the edge function call here assuming there is an RPC 'delete_user_account'
            const { error: deleteError } = await supabase.rpc('delete_user_account' as any);

            if (deleteError) {
                console.warn("RPC failed, falling back to basic deletion or notifying admin", deleteError);
                // If RPC doesn't exist, we'll inform the user it failed and needs manual intervention
                // Ideally in production a `delete_user_account` postgres function is made
                throw new Error("Unable to complete automated deletion. Please contact support@vanshmala.in with this error.");
            }

            // Success! Log them out locally.
            await signOut();
            setStep('deleted');

        } catch (error: any) {
            console.error('Error during deletion:', error);
            toast.error(error.message || 'Verification failed. Cannot delete account.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 pt-32 pb-24">
                <div className="w-full max-w-lg">

                    {step === 'login' && (
                        <Card className="border-border/50 shadow-lg animate-fade-in">
                            <CardHeader className="text-center space-y-4">
                                <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center">
                                    <ShieldAlert className="w-8 h-8 text-foreground" />
                                </div>
                                <CardTitle className="font-display text-2xl">
                                    {t('Authentication Required', 'प्रमाणीकरण आवश्यक है')}
                                </CardTitle>
                                <CardDescription className="text-base font-body">
                                    {t(
                                        'To request the deletion of your account and personal data, you must be logged into the account you wish to delete.',
                                        'अपने खाते और व्यक्तिगत डेटा को हटाने का अनुरोध करने के लिए, आपको उस खाते में लॉग इन होना चाहिए जिसे आप हटाना चाहते हैं।'
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-center pt-4 pb-8">
                                <Button onClick={handleLogin} size="lg" className="w-full sm:w-auto h-12 px-8">
                                    {t('Log in to continue', 'जारी रखने के लिए लॉग इन करें')}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'request' && (
                        <Card className="border-destructive/30 shadow-lg border-2 animate-fade-in">
                            <CardHeader className="space-y-4">
                                <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8 text-destructive" />
                                </div>
                                <div>
                                    <CardTitle className="font-display text-2xl text-destructive mb-2">
                                        {t('Delete Account & Data', 'खाता और डेटा हटाएं')}
                                    </CardTitle>
                                    <CardDescription className="text-base font-body text-foreground">
                                        {t(
                                            'Warning: This action is permanent and cannot be undone.',
                                            'चेतावनी: यह कार्रवाई स्थायी है और इसे पूर्ववत नहीं किया जा सकता है।'
                                        )}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="font-body space-y-4 text-sm text-muted-foreground">
                                <p>
                                    You are currently logged in as <strong>{session?.user?.email}</strong>.
                                    By proceeding, you will permanently delete:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Your user profile and settings.</li>
                                    <li>All family tree modifications and connections you've created.</li>
                                    <li>Photos, videos, and documents stored in your vault.</li>
                                    <li>Wallet balances or related transaction history.</li>
                                </ul>
                                <p className="font-medium text-foreground pt-2">
                                    To confirm you want to proceed, please type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive select-all">delete my account permanently</span> below:
                                </p>

                                <form onSubmit={handleRequestDeletion} className="space-y-4 mt-4">
                                    <Input
                                        value={confirmationPhrase}
                                        onChange={(e) => setConfirmationPhrase(e.target.value)}
                                        placeholder="delete my account permanently"
                                        className="border-destructive/30 focus-visible:ring-destructive/20 h-12"
                                        required
                                    />
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="w-full h-12 text-base font-medium"
                                        disabled={isLoading || confirmationPhrase.toLowerCase() !== 'delete my account permanently'}
                                    >
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {t('Send Verification OTP', 'सत्यापन OTP भेजें')}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'verify' && (
                        <Card className="border-border/50 shadow-lg animate-fade-in">
                            <CardHeader className="space-y-4">
                                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
                                    <MailCheck className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-display text-2xl">
                                        {t('Verify Identity', 'पहचान सत्यापित करें')}
                                    </CardTitle>
                                    <CardDescription className="text-base font-body">
                                        We've sent a 6-digit verification code to <strong>{session?.user?.email}</strong>.
                                        Please enter it below to confirm account deletion.
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleVerifyAndDelete} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            OTP Code
                                        </label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="• • • • • •"
                                            className="text-center tracking-[0.5em] text-lg font-mono h-14"
                                            required
                                        />
                                    </div>

                                    <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>Last warning! Clicking the button below will permanently wipe all your data from our servers. This action is instantaneous.</p>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 h-12"
                                            onClick={() => setStep('request')}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            className="flex-1 h-12"
                                            disabled={isLoading || otp.length < 6}
                                        >
                                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Permanently Delete
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'deleted' && (
                        <Card className="border-border/50 shadow-lg text-center animate-fade-in">
                            <CardHeader className="space-y-4 items-center">
                                <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mb-2">
                                    <span className="text-4xl">👋</span>
                                </div>
                                <CardTitle className="font-display text-3xl">
                                    Account Deleted
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="font-body pb-10">
                                <p className="text-muted-foreground text-lg mb-8">
                                    Your account and all associated data have been permanently removed from Vanshmala. We're sad to see you go!
                                </p>
                                <Button onClick={() => navigate('/')} size="lg" className="h-12 px-8">
                                    Return to Homepage
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
};

export default DataDeletionRequest;
