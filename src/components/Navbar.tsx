import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import { Link } from 'react-router-dom';
import { User } from 'lucide-react';

const OmIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <text x="50" y="72" textAnchor="middle" fontSize="60" fontFamily="serif" className="text-primary-foreground">ॐ</text>
  </svg>
);

const Navbar = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();

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
          {user && (
            <Link to="/dashboard" className="hover:text-accent transition-colors">
              {t('Dashboard', 'डैशबोर्ड')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          {user ? (
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-saffron text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-saffron"
            >
              <User className="w-3.5 h-3.5" />
              {profile?.full_name?.split(' ')[0] || t('Dashboard', 'डैशबोर्ड')}
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-gradient-saffron text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-saffron"
            >
              {t('Sign In', 'साइन इन')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
