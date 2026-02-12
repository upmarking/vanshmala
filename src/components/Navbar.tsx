import { useLanguage } from '@/contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { Link } from 'react-router-dom';

const OmIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <text x="50" y="72" textAnchor="middle" fontSize="60" fontFamily="serif" className="text-primary-foreground">ॐ</text>
  </svg>
);

const Navbar = () => {
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-saffron flex items-center justify-center shadow-saffron">
            <OmIcon />
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-tight">
            {t('Vanshmala', 'वंशमाला')}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-body text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-accent transition-colors">
            {t('Home', 'होम')}
          </Link>
          <Link to="/tree" className="hover:text-accent transition-colors">
            {t('Family Tree', 'वंशवृक्ष')}
          </Link>
          <Link to="/register" className="hover:text-accent transition-colors">
            {t('Register', 'पंजीकरण')}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            to="/register"
            className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-gradient-saffron text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-saffron"
          >
            {t('Get Started', 'शुरू करें')}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
