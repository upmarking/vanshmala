import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const { t } = useLanguage();
  const { signIn, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('Please fill all fields', 'कृपया सभी फ़ील्ड भरें'));
      return;
    }
    setLoading(true);
    // Reset resend state on new attempt
    setShowResend(false);

    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        setShowResend(true);
        toast.error(t('Please verify your email first.', 'कृपया पहले अपना ईमेल सत्यापित करें।'));
      } else {
        toast.error(error.message || t('Login failed', 'लॉगिन विफल'));
      }
    } else {
      toast.success(t('Welcome back!', 'वापसी पर स्वागत!'));
      navigate('/dashboard');
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
    setCountdown(180);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t('Verification email sent!', 'सत्यापन ईमेल भेजा गया!'));
      // Optionally redirect to verify page
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
          <form onSubmit={handleLogin} className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

            <div className="text-center mb-8">
              <span className="text-saffron/40 text-2xl block mb-3">ॐ</span>
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                {t('Welcome Back', 'पुनः स्वागत है')}
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                {t('Sign in to your Vanshmala account', 'अपने वंशमाला खाते में साइन इन करें')}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Email', 'ईमेल')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('Enter your email', 'अपना ईमेल दर्ज करें')}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                  {t('Password', 'पासवर्ड')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-saffron hover:underline font-medium"
                >
                  {t('Forgot Password?', 'पासवर्ड भूल गए?')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">{t('Signing in...', 'साइन इन हो रहा है...')}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    {t('Sign In', 'साइन इन')}
                  </>
                )}
              </button>

              {showResend && (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
                    {t('Your email is not verified yet.', 'आपका ईमेल अभी सत्यापित नहीं है।')}
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendLoading || countdown > 0}
                    className="w-full text-xs py-2 rounded-lg border border-saffron/50 text-saffron hover:bg-saffron/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resendLoading ? (
                      <span className="animate-pulse">{t('Sending...', 'भेज रहा है...')}</span>
                    ) : countdown > 0 ? (
                      `${t('Resend in', 'पुनः भेजें')} ${countdown}s`
                    ) : (
                      t('Resend Verification Email', 'सत्यापन ईमेल पुनः भेजें')
                    )}
                  </button>
                </div>
              )}
            </div>

            <p className="text-center mt-6 font-body text-sm text-muted-foreground">
              {t("Don't have an account?", 'खाता नहीं है?')}{' '}
              <Link to="/register" className="text-saffron hover:underline font-medium">
                {t('Sign Up', 'पंजीकरण करें')}
              </Link>
            </p>
          </form>
        </motion.div>
      </div>


      {
        showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

              <h2 className="text-xl font-bold mb-4 font-display">{t('Reset Password', 'पासवर्ड रीसेट करें')}</h2>
              <p className="text-sm text-muted-foreground mb-6 font-body">
                {t('Enter your email address to receive a password reset link.', 'पासवर्ड रीसेट लिंक प्राप्त करने के लिए अपना ईमेल पता दर्ज करें।')}
              </p>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!resetEmail) return;

                setResetLoading(true);
                const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                  redirectTo: window.location.origin + '/update-password',
                });
                setResetLoading(false);

                if (error) {
                  toast.error(error.message);
                } else {
                  toast.success(t('Check your email for the reset link', 'रीसेट लिंक के लिए अपना ईमेल चेक करें'));
                  setShowForgotPassword(false);
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                      {t('Email', 'ईमेल')}
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder={t('Enter your email', 'अपना ईमेल दर्ज करें')}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 py-2.5 rounded-xl border border-input bg-background hover:bg-accent/50 text-foreground font-medium font-body transition-colors"
                    >
                      {t('Cancel', 'रद्द करें')}
                    </button>
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron disabled:opacity-50"
                    >
                      {resetLoading ? t('Sending...', 'भेज रहा है...') : t('Send Link', 'लिंक भेजें')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )
      }
    </div >
  );
};

export default Login;
