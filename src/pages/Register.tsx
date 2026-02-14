import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

const Register = () => {
  const { t } = useLanguage();
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [fullName, setFullName] = useState('');
  const [gotra, setGotra] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error(t('Please fill all required fields', 'कृपया सभी आवश्यक फ़ील्ड भरें'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('Password must be at least 6 characters', 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए'));
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName, gotra, refCode);
    setLoading(false);

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        setShowResend(true);
      }
      toast.error(error.message || t('Registration failed', 'पंजीकरण विफल'));
    } else {
      // Pass email to verify page
      navigate('/verify-email', { state: { email } });
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard'
      }
    });
    setResendLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Verification email sent!', 'सत्यापन ईमेल भेजा गया!'));
      navigate('/verify-email', { state: { email } });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-saffron/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gold/4 blur-3xl" />

      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-4"
        >
          <form onSubmit={handleRegister} className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

            <div className="text-center mb-8">
              <span className="text-saffron/40 text-2xl block mb-3">ॐ</span>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                {t('Join Vanshmala', 'वंशमाला से जुड़ें')}
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                {t("Begin your family's digital parampara", 'अपने परिवार की डिजिटल परंपरा शुरू करें')}
              </p>
            </div>

            <div className="space-y-4">
              {/* ... existing fields ... */}
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Full Name', 'पूरा नाम')} *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('Enter your full name', 'अपना पूरा नाम दर्ज करें')}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Gotra (Optional)', 'गोत्र (वैकल्पिक)')}
                </label>
                <input
                  type="text"
                  value={gotra}
                  onChange={(e) => setGotra(e.target.value)}
                  placeholder={t('Your family gotra', 'आपका पारिवारिक गोत्र')}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Email', 'ईमेल')} *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Enter your email', 'अपना ईमेल दर्ज करें')}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  required
                  disabled={showResend}
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Password', 'पासवर्ड')} *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  required
                  minLength={6}
                />
              </div>

              {refCode && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
                  🎁 {t(`Referral code applied: ${refCode} — You'll get ₹11!`, `रेफरल कोड लागू: ${refCode} — आपको ₹11 मिलेंगे!`)}
                </div>
              )}

              {!showResend ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
                >
                  {loading ? (
                    <span className="animate-pulse">{t('Creating Account...', 'खाता बन रहा है...')}</span>
                  ) : (
                    <>
                      {t('Create Account', 'खाता बनाएं')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
                    {t('Account already exists but is not verified.', 'खाता पहले से मौजूद है लेकिन सत्यापित नहीं है।')}
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-saffron text-saffron font-medium font-body hover:bg-saffron/5 transition-colors disabled:opacity-50"
                  >
                    {resendLoading ? (
                      <span className="animate-pulse">{t('Sending...', 'भेज रहा है...')}</span>
                    ) : (
                      t('Resend Verification Email', 'सत्यापन ईमेल पुनः भेजें')
                    )}
                  </button>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
