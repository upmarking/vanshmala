import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, TreePine, Archive, ChevronDown, Gift, MessageSquare, Wallet, IdCard, Copy } from 'lucide-react';
import { toast } from 'sonner';
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
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NotificationBell } from '@/components/NotificationBell';

const OmIcon = () => (
  <svg viewBox="0 0 100 100" className="w-6 h-6" fill="currentColor">
    <text x="50" y="72" textAnchor="middle" fontSize="60" fontFamily="serif" className="text-primary-foreground">ॐ</text>
  </svg>
);

const Navbar = () => {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      const fetchWallet = async () => {
        const { data } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setBalance(data.balance);
        }
      };

      fetchWallet();

      // Real-time subscription for wallet updates
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'wallets',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setBalance((payload.new as any).balance);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const isActive = (path: string) => location.pathname === path;

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
          <Link
            to={user ? "/dashboard" : "/"}
            className={`hover:text-accent transition-colors ${isActive(user ? "/dashboard" : "/") ? "text-saffron font-bold" : ""}`}
          >
            {user ? t('Dashboard', 'डैशबोर्ड') : t('Home', 'होम')}
          </Link>
          {user && (
            <>
              <Link
                to="/tree"
                className={`hover:text-accent transition-colors ${isActive('/tree') ? "text-saffron font-bold" : ""}`}
              >
                {t('Family Tree', 'कुलवृक्ष')}
              </Link>
              <Link
                to="/feed"
                className={`hover:text-accent transition-colors ${isActive('/feed') ? "text-saffron font-bold" : ""}`}
              >
                {t('Feed', 'फ़ीड')}
              </Link>
              <Link
                to="/vault"
                className={`hover:text-accent transition-colors ${isActive('/vault') ? "text-saffron font-bold" : ""}`}
              >
                {t('Legacy Vault', 'विरासत तिजोरी')}
              </Link>
              <Link
                to="/refer"
                className={`hover:text-accent transition-colors ${isActive('/refer') ? "text-saffron font-bold" : ""}`}
              >
                {t('Refer & Earn', 'रेफर करें')}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Link to="/wallet" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors font-medium text-sm border border-amber-200">
              <Wallet className="w-4 h-4" />
              <span className="font-bold">{t('Dhan', 'धन')}</span>
              <span>₹{balance !== null ? balance.toFixed(2) : '0.00'}</span>
            </Link>
          )}
          <LanguageToggle />

          {/* Notification Bell (desktop) */}
          {user && <NotificationBell />}

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
                <DropdownMenuLabel className="font-normal px-4 py-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold text-foreground leading-tight">{profile?.full_name || 'User'}</p>
                      <p className="text-[11px] font-medium text-muted-foreground leading-none">
                        {user.email}
                      </p>
                    </div>

                    <div
                      className="relative overflow-hidden group border border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 rounded-xl p-2.5 transition-all hover:border-amber-400 hover:shadow-sm active:scale-[0.98] cursor-copy"
                      onClick={() => {
                        navigator.clipboard.writeText(profile?.vanshmala_id || '');
                        toast.success(t('ID Copied', 'ID कॉपी हो गया'));
                      }}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <IdCard size={14} className="text-amber-600" />
                            <span className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest leading-none">Member ID</span>
                          </div>
                          <Copy size={11} className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-sm font-black text-amber-900 font-mono tracking-tight leading-none">
                          {profile?.vanshmala_id || 'PENDING'}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 w-16 h-16 bg-amber-200/5 rounded-full -mr-8 -mt-8" />
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className={isActive('/dashboard') ? "text-saffron font-bold" : ""}>
                  <TreePine className="mr-2 h-4 w-4" />
                  <span>{t('Dashboard', 'डैशबोर्ड')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/feed')} className={isActive('/feed') ? "text-saffron font-bold" : ""}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>{t('Feed', 'फ़ीड')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/tree')} className={isActive('/tree') ? "text-saffron font-bold" : ""}>
                  <TreePine className="mr-2 h-4 w-4" />
                  <span>{t('Family Tree', 'कुलवृक्ष')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/vault')} className={isActive('/vault') ? "text-saffron font-bold" : ""}>
                  <Archive className="mr-2 h-4 w-4" />
                  <span>{t('Legacy Vault', 'विरासत तिजोरी')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/refer')} className={isActive('/refer') ? "text-saffron font-bold" : ""}>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>{t('Refer & Earn', 'रेफर करें')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings/profile')} className={isActive('/settings/profile') ? "text-saffron font-bold" : ""}>
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

