import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-warm" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-gold/5 blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />

      {/* Decorative mandala-style rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-border/30 rounded-full opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-border/20 rounded-full opacity-20" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              {t('Your Family Legacy, Digitized', 'आपकी पारिवारिक विरासत, डिजिटल')}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6"
          >
            {t('Preserve Your', 'अपनी')}{' '}
            <span className="text-gradient-gold">{t('Vanshmala', 'वंशमाला')}</span>
            <br />
            {t('For Generations', 'पीढ़ियों के लिए संजोएं')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            {t(
              'Transform your handwritten genealogy into a beautiful, interactive digital family tree. Connect with relatives, preserve memories, and build your family\'s living legacy.',
              'अपनी हस्तलिखित वंशावली को एक सुंदर, इंटरैक्टिव डिजिटल वंशवृक्ष में बदलें। रिश्तेदारों से जुड़ें, यादें संजोएं, और अपने परिवार की जीवित विरासत बनाएं।'
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-hero text-primary-foreground font-medium text-lg hover:opacity-90 transition-all shadow-soft"
            >
              {t('Start Your Tree', 'अपना वंशवृक्ष शुरू करें')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/tree"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border border-border bg-card font-medium text-lg hover:bg-secondary transition-colors"
            >
              {t('View Demo', 'डेमो देखें')}
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 mt-20 max-w-lg mx-auto"
          >
            {[
              { icon: Users, label: t('Families', 'परिवार'), value: '1,000+' },
              { icon: BookOpen, label: t('Generations', 'पीढ़ियां'), value: '7+' },
              { icon: Shield, label: t('Privacy', 'गोपनीयता'), value: '100%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-gold" />
                <div className="font-display text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="font-body text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
