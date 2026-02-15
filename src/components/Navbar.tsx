import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, TreePine, Archive, ChevronDown, Gift, MessageSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const OmIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <text x="50" y="72" textAnchor="middle" fontSize="60" fontFamily="serif" className="text-primary-foreground">ॐ</text>
  </svg>
);

const Navbar = () => {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 rounded-lg bg-gradient-saffron flex items-center justify-center shadow-saffron">
            <OmIcon />
          </div>
          <span className="font-display text-xl font-bold text-foreground tracking-tight hidden sm:block">
            {t('Vanshmala', 'वंशमाला')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 font-body text-sm font-medium text-muted-foreground">
          <Link to="/" className="hover:text-accent transition-colors">
            {t('Home', 'होम')}
          </Link>
          {user && (
            <>
              <Link to="/tree" className="hover:text-accent transition-colors">
                {t('Family Tree', 'कुलवृक्ष')}
              </Link>
              <Link to="/feed" className="hover:text-accent transition-colors">
                {t('Feed', 'फ़ीड')}
              </Link>
              <Link to="/vault" className="hover:text-accent transition-colors">
                {t('Legacy Vault', 'विरासत तिजोरी')}
              </Link>
              <Link to="/refer" className="hover:text-accent transition-colors text-saffron font-semibold">
                {t('Refer & Earn', 'रेफर करें')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-saffron text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <TreePine className="mr-2 h-4 w-4" />
                  <span>{t('Dashboard', 'डैशबोर्ड')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/feed')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{t('Feed', 'फ़ीड')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/tree')}>
                  <TreePine className="mr-2 h-4 w-4" />
                  <span>{t('Family Tree', 'कुलवृक्ष')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/vault')}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>{t('Legacy Vault', 'विरासत तिजोरी')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/refer')} className="text-saffron focus:text-saffron">
                  <Gift className="mr-2 h-4 w-4" />
                  <span>{t('Refer & Earn', 'रेफर करें')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t('Settings', 'सेटिंग्स')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t('Sign Out', 'साइन आउट')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-gradient-saffron text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-saffron"
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

