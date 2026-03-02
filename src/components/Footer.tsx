import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-12 bg-foreground text-primary-foreground relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-saffron opacity-40" />

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center gap-4">
          {/* Om symbol */}
          <span className="text-saffron/30 text-3xl">ॐ</span>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold">{t('Vanshmala', 'वंशमाला')}</span>
          </div>
          <p className="font-body text-sm opacity-50 text-center">
            {t(
              '© 2026 Vanshmala. Preserving family legacies — one parampara at a time.',
              '© 2026 वंशमाला। परिवार की विरासत को संजोना — एक परंपरा।'
            )}
          </p>
          <div className="flex gap-4 mt-2 text-sm opacity-70">
            <Link to="/contact-us" className="hover:text-saffron transition-colors">
              {t('Contact Us', 'संपर्क करें')}
            </Link>
            <span>|</span>
            <Link to="/privacy-policy" className="hover:text-saffron transition-colors">
              {t('Privacy Policy', 'गोपनीयता नीति')}
            </Link>
            <span>|</span>
            <Link to="/terms-of-use" className="hover:text-saffron transition-colors">
              {t('Terms of Use', 'उपयोग की शर्तें')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
