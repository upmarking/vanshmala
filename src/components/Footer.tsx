import { useLanguage } from '@/contexts/LanguageContext';
import { TreePine } from 'lucide-react';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-12 bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-gold" />
            <span className="font-display text-lg font-bold">{t('Vanshmala', 'वंशमाला')}</span>
          </div>
          <p className="font-body text-sm opacity-60">
            {t(
              '© 2026 Vanshmala. Preserving family legacies, one tree at a time.',
              '© 2026 वंशमाला। परिवार की विरासत को संजोना।'
            )}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
