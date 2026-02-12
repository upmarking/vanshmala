import { useLanguage } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card hover:bg-secondary transition-colors text-sm font-body"
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{language === 'en' ? 'हिंदी' : 'English'}</span>
    </button>
  );
};

export default LanguageToggle;
