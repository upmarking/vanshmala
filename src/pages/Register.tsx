import { useLanguage } from '@/contexts/LanguageContext';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';
import { ArrowRight, Users, TreePine } from 'lucide-react';
import { useState } from 'react';

const Register = () => {
  const { t } = useLanguage();
  const [step, setStep] = useState<'register' | 'choice'>('register');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Navbar />

      {/* Background decorations */}
      <div className="absolute top-32 right-10 w-64 h-64 rounded-full bg-saffron/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gold/4 blur-3xl" />

      <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md mx-4"
        >
          {step === 'register' ? (
            <div className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden">
              {/* Saffron accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

              <div className="text-center mb-8">
                <span className="text-saffron/40 text-2xl block mb-3">ॐ</span>
                <h1 className="font-display text-2xl font-bold text-foreground mb-1">
                  {t('Join Vanshmala', 'वंशमाला से जुड़ें')}
                </h1>
                <p className="font-body text-sm text-muted-foreground">
                  {t('Begin your family\'s digital parampara', 'अपने परिवार की डिजिटल परंपरा शुरू करें')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Full Name', 'पूरा नाम')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('Enter your full name', 'अपना पूरा नाम दर्ज करें')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Gotra (Optional)', 'गोत्र (वैकल्पिक)')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('Your family gotra', 'आपका पारिवारिक गोत्र')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Mobile / Email', 'मोबाइल / ईमेल')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('Phone number or email', 'फ़ोन नंबर या ईमेल')}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-medium text-foreground mb-1.5">
                    {t('Password', 'पासवर्ड')}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-saffron/40 focus:border-saffron/40"
                  />
                </div>

                <button
                  onClick={() => setStep('choice')}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-saffron text-primary-foreground font-medium font-body hover:opacity-90 transition-opacity shadow-saffron"
                >
                  {t('Create Account', 'खाता बनाएं')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-card border border-border shadow-elevated relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-saffron" />

              <div className="text-center mb-8">
                <span className="text-gold/50 text-2xl block mb-2">✦</span>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  {t('Welcome! What would you like to do?', 'स्वागत है! आप क्या करना चाहेंगे?')}
                </h2>
                <p className="font-body text-sm text-muted-foreground">
                  {t('Your Vanshmala ID: ', 'आपकी वंशमाला ID: ')}
                  <span className="font-semibold text-saffron">VM-009</span>
                </p>
              </div>

              <div className="space-y-4">
                <button className="w-full p-5 rounded-xl border-2 border-border hover:border-saffron/40 bg-background transition-all text-left group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-saffron/10 flex items-center justify-center flex-shrink-0 group-hover:bg-saffron/15 transition-colors">
                      <TreePine className="w-5 h-5 text-saffron" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {t('Create New Kulvriksha', 'नया कुलवृक्ष बनाएं')}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground mt-1">
                        {t('Start your own family tree from scratch', 'शुरुआत से अपना वंशवृक्ष बनाएं')}
                      </p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-5 rounded-xl border-2 border-border hover:border-gold/40 bg-background transition-all text-left group">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/15 transition-colors">
                      <Users className="w-5 h-5 text-gold-dark" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-semibold text-foreground">
                        {t('Join Existing Family', 'मौजूदा परिवार से जुड़ें')}
                      </h3>
                      <p className="font-body text-sm text-muted-foreground mt-1">
                        {t('Enter a Family ID to join your kulvriksha', 'अपने कुलवृक्ष से जुड़ने के लिए परिवार ID दर्ज करें')}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
