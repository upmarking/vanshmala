import { ReactNode } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MobileTopBar from '@/components/layout/MobileTopBar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface MainLayoutProps {
    children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Desktop nav — hidden on mobile */}
            <div className="hidden md:block">
                <Navbar />
            </div>

            {/* Mobile top bar — hidden on desktop */}
            <MobileTopBar />

            {/* Main content
                Mobile: pt accounts for MobileTopBar (56px) + safe area
                Desktop: pt-16 (64px) for fixed Navbar */}
            <main
                className="flex-1 md:pt-16 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0"
                style={{
                    paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))'
                }}
            >
                {children}
            </main>

            {/* Desktop footer — hidden on mobile */}
            <div className="hidden md:block">
                <Footer />
            </div>

            {/* Mobile bottom nav — hidden on desktop */}
            <MobileBottomNav />
        </div>
    );
};

export default MainLayout;
