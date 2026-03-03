import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import MobileProfileSheet from './MobileProfileSheet';

const OmIcon = () => (
    <svg viewBox="0 0 100 100" className="w-5 h-5" fill="currentColor">
        <text x="50" y="72" textAnchor="middle" fontSize="62" fontFamily="serif" className="text-primary-foreground">ॐ</text>
    </svg>
);

const MobileTopBar = () => {
    const { user, profile } = useAuth();
    const [balance, setBalance] = useState<number | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    useEffect(() => {
        if (!user) return;

        const fetchWallet = async () => {
            const { data } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', user.id)
                .single();
            if (data) setBalance(data.balance);
        };

        fetchWallet();

        const channel = supabase
            .channel('mobile-topbar-wallet')
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'wallets',
                filter: `user_id=eq.${user.id}`,
            }, (payload) => {
                setBalance((payload.new as any).balance);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user]);

    return (
        <>
            <header
                className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border"
                style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(56px + env(safe-area-inset-top))' }}
            >
                <div className="flex items-center justify-between h-14 px-4">
                    {/* Logo */}
                    <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-xl bg-gradient-saffron flex items-center justify-center shadow-saffron">
                            <OmIcon />
                        </div>
                        <span className="font-display text-lg font-bold text-foreground tracking-tight">
                            Vanshmala
                        </span>
                    </Link>

                    {/* Right actions */}
                    {user ? (
                        <div className="flex items-center gap-2">
                            {/* Wallet chip — tapping opens Wallet page */}
                            {balance !== null && (
                                <Link
                                    to="/wallet"
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 active:scale-95 transition-transform"
                                >
                                    <span className="text-xs font-bold text-amber-900">₹{balance.toFixed(0)}</span>
                                </Link>
                            )}

                            {/* Avatar — opens profile sheet */}
                            <button
                                onClick={() => setSheetOpen(true)}
                                className="relative w-9 h-9 rounded-full ring-2 ring-orange-300 ring-offset-1 ring-offset-background transition-transform active:scale-95"
                                aria-label="Open profile menu"
                            >
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                                    <AvatarFallback className="bg-gradient-saffron text-primary-foreground text-sm font-bold">
                                        {getInitials(profile?.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                            </button>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="px-4 py-2 rounded-full bg-gradient-saffron text-primary-foreground text-sm font-semibold shadow-saffron active:opacity-80 transition-opacity"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </header>

            {/* Profile bottom sheet */}
            <MobileProfileSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                balance={balance}
            />
        </>
    );
};

export default MobileTopBar;
