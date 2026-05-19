import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VanshMitraGate() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-lg w-full text-center space-y-8"
      >
        {/* Decorative mandala */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
          className="mx-auto w-32 h-32 relative"
        >
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-gold/30" />
          <div className="absolute inset-3 rounded-full border border-saffron/20" />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 flex items-center justify-center">
            <span className="text-5xl">🪷</span>
          </div>
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            <span className="text-gradient-saffron">
              {t('VanshMitra', 'वंशमित्र')}
            </span>
          </h1>
          <p className="text-lg text-muted-foreground font-display italic">
            {t('Your AI Vedic Astrologer', 'आपका AI वैदिक ज्योतिषी')}
          </p>
        </div>

        {/* Explanation */}
        <div className="bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-yellow-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-yellow-950/30 rounded-2xl border border-gold/20 p-6 space-y-4 shadow-soft">
          <div className="flex items-start gap-3 text-left">
            <Sparkles className="h-5 w-5 text-saffron mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/90">
                {t(
                  'VanshMitra needs your birth chart to provide personalized predictions.',
                  'वंशमित्र को आपकी जन्म कुंडली चाहिए ताकि व्यक्तिगत भविष्यवाणी दे सकें।',
                )}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t(
                  'Create and save your Kundali with accurate birth details — date, time, and location — so VanshMitra can read your planetary positions, Dashas, Nakshatras, and Yogas for chart-aware guidance.',
                  'अपनी कुंडली बनाएं और सहेजें — सटीक जन्म तिथि, समय और स्थान के साथ — ताकि वंशमित्र आपकी ग्रह स्थिति, दशा, नक्षत्र और योग पढ़ सकें।',
                )}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={() => navigate('/kundali')}
          className="bg-gradient-saffron hover:opacity-90 text-white font-semibold h-12 px-8 text-base shadow-saffron transition-all duration-200 gap-2"
        >
          {t('Create Your Kundali', 'अपनी कुंडली बनाएं')}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-[11px] text-muted-foreground/60">
          {t(
            'Your data is securely stored and only used for astrological guidance.',
            'आपका डेटा सुरक्षित रूप से संग्रहीत है और केवल ज्योतिषीय मार्गदर्शन के लिए उपयोग किया जाता है।',
          )}
        </p>
      </motion.div>
    </div>
  );
}
