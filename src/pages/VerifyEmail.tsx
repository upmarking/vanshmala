import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const email = location.state?.email;
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!email) {
      toast.error(t('Email not found. Please try logging in.', 'ईमेल नहीं मिला। कृपया लॉग इन करने का प्रयास करें।'));
      return;
    }

    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard'
      }
    });
    setResending(false);

    if (error) {
      // if user is already verified etc
      toast.error(error.message);
    } else {
      toast.success(t('Verification email sent again!', 'सत्यापन ईमेल फिर से भेजा गया!'));
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />
      <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-saffron/5 blur-3xl" />

      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-4"
        >
          <div className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-saffron/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-saffron" />
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground mb-3">
              {t('Check Your Email', 'अपना ईमेल जांचें')}
            </h1>

            <p className="font-body text-muted-foreground mb-2">
              {t(
                'We have sent a verification link to your email address. Please click the link to verify your account.',
                'हमने आपके ईमेल पते पर एक सत्यापन लिंक भेजा है। कृपया अपना खाता सत्यापित करने के लिए लिंक पर क्लिक करें।'
              )}
            </p>
            {email && <p className="font-medium text-foreground">{email}</p>}

            <div className="mt-6 p-4 rounded-xl bg-saffron/5 border border-saffron/10">
              <p className="font-body text-sm text-foreground">
                {t(
                  '✦ Check your spam folder if you don\'t see the email',
                  '✦ यदि आपको ईमेल नहीं दिखता तो स्पैम फ़ोल्डर जांचें'
                )}
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron"
              >
                {t('Go to Login', 'लॉगिन पर जाएं')}
                <ArrowRight className="w-4 h-4" />
              </Link>

              {email && (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-input hover:bg-accent text-sm font-medium transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? t('Sending...', 'भेज रहा है...') : t('Resend Verification Email', 'सत्यापन ईमेल पुनः भेजें')}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
