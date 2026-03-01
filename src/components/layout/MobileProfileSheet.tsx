import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    LayoutDashboard, TreePine, MessageSquare, Archive, Gift,
    Settings, LogOut, X, Wallet, IdCard, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import LanguageToggle from '@/components/LanguageToggle';

interface MobileProfileSheetProps {
    open: boolean;
    onClose: () => void;
    balance: number | null;
}

const MobileProfileSheet = ({ open, onClose, balance }: MobileProfileSheetProps) => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const overlayRef = useRef<HTMLDivElement>(null);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const go = (route: string) => {
        navigate(route);
        onClose();
    };

    const handleSignOut = async () => {
        onClose();
        await signOut();
        navigate('/login');
    };

    // Trap body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', labelHi: 'डैशबोर्ड', route: '/dashboard' },
        { icon: TreePine, label: 'Family Tree', labelHi: 'कुलवृक्ष', route: '/tree' },
        { icon: MessageSquare, label: 'Feed', labelHi: 'फ़ीड', route: '/feed' },
        { icon: Archive, label: 'Legacy Vault', labelHi: 'विरासत तिजोरी', route: '/vault' },
        { icon: Gift, label: 'Refer & Earn', labelHi: 'रेफर करें', route: '/refer' },
        { icon: Wallet, label: 'Wallet', labelHi: 'वॉलेट', route: '/wallet' },
        { icon: Settings, label: 'Settings', labelHi: 'सेटिंग्स', route: '/settings/profile' },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                ref={overlayRef}
                className={`md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sheet */}
            <div
                className={`md:hidden fixed left-0 right-0 bottom-0 z-[61] bg-background rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out`}
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                }}
                role="dialog"
                aria-modal="true"
                aria-label="Profile menu"
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14 border-2 border-orange-300 shadow-md flex-shrink-0">
                            <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                            <AvatarFallback className="bg-gradient-saffron text-primary-foreground text-lg font-bold">
                                {getInitials(profile?.full_name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-1">
                            <p className="font-bold text-lg leading-tight text-foreground">{profile?.full_name || 'User'}</p>
                            <p className="text-xs text-muted-foreground font-medium mb-2">{user?.email}</p>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(profile?.vanshmala_id || '');
                                    toast.success(t('ID Copied', 'ID कॉपी हो गया'));
                                }}
                                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/60 shadow-sm active:scale-95 transition-all text-left"
                            >
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <IdCard size={12} className="text-amber-600" />
                                        <span className="text-[8px] font-bold text-amber-700/60 uppercase tracking-[0.1em]">Identity Card</span>
                                    </div>
                                    <span className="text-[13px] font-black font-mono text-amber-950 leading-none">
                                        {profile?.vanshmala_id || 'PENDING'}
                                    </span>
                                </div>
                                <div className="p-1 rounded-md bg-white/50 border border-amber-100">
                                    <Copy size={12} className="text-amber-500" />
                                </div>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Wallet chip */}
                {balance !== null && (
                    <button
                        onClick={() => go('/wallet')}
                        className="mx-5 mb-3 flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-100 border border-amber-200 w-[calc(100%-40px)]"
                    >
                        <Wallet size={18} className="text-amber-700" />
                        <span className="text-sm font-semibold text-amber-800">{t('Dhan', 'धन')}</span>
                        <span className="ml-auto text-sm font-bold text-amber-900">₹{balance.toFixed(2)}</span>
                    </button>
                )}

                {/* Language toggle */}
                <div className="mx-5 mb-2 flex items-center justify-between px-4 py-3 rounded-2xl bg-muted/50">
                    <span className="text-sm font-medium">{t('Language', 'भाषा')}</span>
                    <LanguageToggle />
                </div>

                {/* Divider */}
                <div className="mx-5 my-2 h-px bg-border" />

                {/* Navigation items */}
                <div className="px-3">
                    {menuItems.map(({ icon: Icon, label, labelHi, route }) => (
                        <button
                            key={route}
                            onClick={() => go(route)}
                            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-muted active:bg-muted/80 transition-colors text-left min-h-[52px]"
                        >
                            <Icon size={20} className="text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{t(label, labelHi)}</span>
                        </button>
                    ))}
                </div>

                {/* Divider */}
                <div className="mx-5 my-2 h-px bg-border" />

                {/* Sign out */}
                <div className="px-3 pb-2">
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-red-50 active:bg-red-100 transition-colors text-left min-h-[52px]"
                    >
                        <LogOut size={20} className="text-destructive shrink-0" />
                        <span className="text-sm font-medium text-destructive">{t('Sign Out', 'साइन आउट')}</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default MobileProfileSheet;
