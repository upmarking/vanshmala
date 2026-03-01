
import { useState, useRef, useCallback } from "react";
import { CreatePost } from "@/components/feed/CreatePost";
import { FeedList } from "@/components/feed/FeedList";
import { Plus, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Feed = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const { t } = useLanguage();

    // Pull-to-refresh state
    const touchStartY = useRef(0);
    const touchCurrentY = useRef(0);
    const PTR_THRESHOLD = 72;

    const triggerRefresh = useCallback(() => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        setRefreshTrigger((prev) => prev + 1);
        setTimeout(() => setIsRefreshing(false), 1200);
    }, [isRefreshing]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
        const delta = touchCurrentY.current - touchStartY.current;
        if (delta > PTR_THRESHOLD && window.scrollY === 0) {
            triggerRefresh();
        }
        touchCurrentY.current = 0;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchCurrentY.current = e.touches[0].clientY;
    };

    const handlePostCreated = () => {
        setRefreshTrigger((prev) => prev + 1);
        setShowCreatePost(false);
    };

    return (
        <>
            <div
                className="animate-fade-in-up"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Pull-to-refresh indicator */}
                {isRefreshing && (
                    <div className="ptr-indicator">
                        <RefreshCw size={18} className="animate-spin text-orange-500 mr-2" />
                        <span className="text-sm text-muted-foreground">{t("Refreshing…", "ताज़ा हो रहा है…")}</span>
                    </div>
                )}

                {/* Content: container on both to match Vault, with padding-top on mobile */}
                <div className="container mx-auto pt-6 md:py-6 md:max-w-2xl px-4">
                    {/* Page title — now visible on both mobile and desktop */}
                    <h1 className="text-2xl md:text-3xl font-bold font-display mb-4 md:mb-6">
                        {t("Feed", "फ़ीड")}
                    </h1>

                    {/* Mobile: inline create post shown when FAB tapped */}
                    {showCreatePost && (
                        <div className="md:hidden px-4 pt-4 pb-2 bg-background border-b border-border">
                            <CreatePost onPostCreated={handlePostCreated} />
                        </div>
                    )}

                    {/* Desktop: always show create post */}
                    <div className="hidden md:block">
                        <CreatePost onPostCreated={handlePostCreated} />
                    </div>

                    <FeedList refreshTrigger={refreshTrigger} />
                </div>
            </div>

            {/* Mobile FAB — Moved outside the animated wrapper to ensure true viewport-fixed positioning */}
            <button
                className="fab md:hidden"
                onClick={() => setShowCreatePost((v) => !v)}
                aria-label={t("Create Post", "पोस्ट बनाएं")}
            >
                <Plus size={24} />
            </button>
        </>
    );
};

export default Feed;
