import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const VerifyEmail = () => {
  const { t } = useLanguage();

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

            <div className="mt-6 p-4 rounded-xl bg-saffron/5 border border-saffron/10">
              <p className="font-body text-sm text-foreground">
                {t(
                  '✦ Check your spam folder if you don\'t see the email',
                  '✦ यदि आपको ईमेल नहीं दिखता तो स्पैम फ़ोल्डर जांचें'
                )}
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron"
            >
              {t('Go to Login', 'लॉगिन पर जाएं')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyEmail;
