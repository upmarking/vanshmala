import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Login = () => {
  const { t } = useLanguage();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(t('Please fill all fields', 'कृपया सभी फ़ील्ड भरें'));
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      if (error.message?.includes('Email not confirmed')) {
        toast.error(t('Please verify your email first. Check your inbox.', 'कृपया पहले अपना ईमेल सत्यापित करें। अपना इनबॉक्स जांचें।'));
      } else {
        toast.error(error.message || t('Login failed', 'लॉगिन विफल'));
      }
    } else {
      toast.success(t('Welcome back!', 'वापसी पर स्वागत!'));
      navigate('/dashboard');
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
    </div>
  );
};

export default Login;
