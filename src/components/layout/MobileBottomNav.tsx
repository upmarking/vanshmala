import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TreePine, MessageSquare, Archive, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavTab {
    icon: React.ElementType;
    label: string;
    labelHi: string;
    route: string;
    exact?: boolean;
}

const tabs: NavTab[] = [
    { icon: LayoutDashboard, label: 'Home', labelHi: 'होम', route: '/dashboard', exact: true },
    { icon: TreePine, label: 'Tree', labelHi: 'वृक्ष', route: '/tree' },
    { icon: MessageSquare, label: 'Feed', labelHi: 'फ़ीड', route: '/feed', exact: true },
    { icon: Mail, label: 'Chat', labelHi: 'चैट', route: '/messages', exact: false },
    { icon: Archive, label: 'Vault', labelHi: 'तिजोरी', route: '/vault', exact: true },
];

const MobileBottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const isActive = (tab: NavTab) => {
        if (tab.exact) return location.pathname === tab.route;
        return location.pathname.startsWith(tab.route);
    };

    const handleTap = (route: string, e: React.MouseEvent<HTMLButtonElement>) => {
        // Ripple effect
        const btn = e.currentTarget;
        const ripple = document.createElement('span');
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      left:${x}px;top:${y}px;
      border-radius:50%;background:currentColor;opacity:0.18;
      transform:scale(0);animation:ripple-expand 0.5s ease-out forwards;
      pointer-events:none;
    `;
        btn.style.overflow = 'hidden';
        btn.style.position = 'relative';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        navigate(route);
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(64px + env(safe-area-inset-bottom))' }}
            aria-label="Bottom navigation"
        >
            <div className="flex items-stretch h-16">
                {tabs.map((tab) => {
                    const active = isActive(tab);
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.route}
                            onClick={(e) => handleTap(tab.route, e)}
                            className={`
                flex-1 flex flex-col items-center justify-center gap-0.5 relative
                transition-colors duration-200 select-none
                ${active ? 'text-orange-500' : 'text-muted-foreground'}
              `}
                            aria-label={t(tab.label, tab.labelHi)}
                            aria-current={active ? 'page' : undefined}
                        >
                            {/* Active pill indicator */}
                            {active && (
                                <span
                                    className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full"
                                    style={{ background: 'hsl(var(--saffron))' }}
                                />
                            )}

                            {/* Icon */}
                            <Icon
                                className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}
                                size={active ? 22 : 20}
                                strokeWidth={active ? 2.5 : 1.8}
                            />

                            {/* Label */}
                            <span className={`text-[10px] font-medium leading-none ${active ? 'font-bold' : ''}`}>
                                {t(tab.label, tab.labelHi)}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;
