import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, BookOpen, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

/* Decorative lotus SVG */
const LotusDecor = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 120 60" className={className} fill="none">
    <ellipse cx="60" cy="50" rx="18" ry="6" fill="hsl(25 85% 52% / 0.1)" />
    {/* Petals */}
    {[-40, -25, -12, 0, 12, 25, 40].map((angle, i) => (
      <ellipse
        key={i}
        cx="60"
        cy="30"
        rx="8"
        ry="22"
        fill={`hsl(25 85% 52% / ${0.08 + i * 0.02})`}
        transform={`rotate(${angle} 60 30)`}
      />
    ))}
  </svg>
);

/* Mandala ring decoration */
const MandalaRing = ({ size, delay }: { size: number; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.5, delay }}
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border animate-spin-slow pointer-events-none"
    style={{
      width: size,
      height: size,
      borderColor: `hsl(42 78% 55% / ${0.08 + (800 - size) / 4000})`,
      borderStyle: size % 200 === 0 ? 'dashed' : 'solid',
    }}
  />
);

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-warm" />

      {/* Saffron glow orbs */}
      <div className="absolute top-32 right-16 w-80 h-80 rounded-full bg-saffron/6 blur-3xl animate-glow" />
      <div className="absolute bottom-20 left-16 w-96 h-96 rounded-full bg-gold/5 blur-3xl animate-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-lotus/5 blur-3xl animate-glow" style={{ animationDelay: '3s' }} />

      {/* Mandala rings */}
      <MandalaRing size={500} delay={0.2} />
      <MandalaRing size={650} delay={0.4} />
      <MandalaRing size={800} delay={0.6} />

      {/* Floating lotus */}
      <div className="absolute top-20 right-20 animate-float opacity-40">
        <LotusDecor className="w-24 h-12" />
      </div>
      <div className="absolute bottom-32 left-16 animate-float opacity-30" style={{ animationDelay: '2s' }}>
        <LotusDecor className="w-16 h-8" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Om symbol badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-saffron/10 border border-saffron/20 text-accent text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
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
            <span className="text-gradient-saffron">{t('Vanshmala', 'वंशमाला')}</span>
            <br />
            {t('For Generations', 'पीढ़ियों के लिए संजोएं')}
          </motion.h1>

          {/* Sanskrit shloka */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="font-display italic text-saffron/60 text-base mb-4"
          >
            {t(
              '"The family is the first school of virtue"',
              '"कुलं धर्मस्य मूलम्" — कुल धर्म की जड़ है'
            )}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
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
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-saffron text-primary-foreground font-medium text-lg hover:opacity-90 transition-all shadow-saffron"
            >
              {t('Start Your Tree', 'अपना वंशवृक्ष शुरू करें')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/tree"
              className="flex items-center gap-2 px-8 py-4 rounded-xl border-2 border-saffron/20 bg-card font-medium text-lg hover:border-saffron/40 hover:bg-saffron/5 transition-all"
            >
              {t('View Demo', 'डेमो देखें')}
            </Link>
          </motion.div>

          {/* Decorative divider — temple-style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center justify-center gap-3 mt-16 mb-10"
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-saffron/30" />
            <span className="text-saffron/40 text-xl">✦</span>
            <span className="text-gold/50 text-sm">ॐ</span>
            <span className="text-saffron/40 text-xl">✦</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-saffron/30" />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="grid grid-cols-3 gap-8 max-w-lg mx-auto"
          >
            {[
              { icon: Users, label: t('Families', 'परिवार'), value: '1,000+' },
              { icon: BookOpen, label: t('Generations', 'पीढ़ियां'), value: '7+' },
              { icon: Shield, label: t('Privacy', 'गोपनीयता'), value: '100%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-saffron" />
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
