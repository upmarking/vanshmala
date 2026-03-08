import { useState } from "react";
import { FeedPost, RewardCounts } from "@/types/feed";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const REWARD_TIERS = [
    { key: "leaf", emoji: "🍃", label: "Leaf", labelHi: "पत्ता", amount: 11 },
    { key: "rose", emoji: "🌹", label: "Rose", labelHi: "गुलाब", amount: 101 },
    { key: "diamond", emoji: "💎", label: "Diamond", labelHi: "हीरा", amount: 501 },
    { key: "star", emoji: "⭐", label: "Star", labelHi: "तारा", amount: 1111 },
] as const;

interface AnshdaanButtonProps {
    post: FeedPost;
    onPostChange?: () => void;
}

export const AnshdaanButton = ({ post, onPostChange }: AnshdaanButtonProps) => {
    const { profile } = useAuth();
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<typeof REWARD_TIERS[number] | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const isOwner = profile?.id === post.user_id;

    const handleSelect = (tier: typeof REWARD_TIERS[number]) => {
        setSelectedReward(tier);
        setOpen(false);
    };

    const handleConfirm = async () => {
        if (!selectedReward || !profile?.id) return;
        setIsProcessing(true);
        try {
            const { error } = await supabase.rpc("process_post_contribution", {
                p_post_id: post.id,
                p_contributor_profile_id: profile.id,
                p_reward_type: selectedReward.key,
            });
            if (error) throw error;
            toast.success(t(
                `${selectedReward.emoji} ${selectedReward.label} gifted successfully!`,
                `${selectedReward.emoji} ${selectedReward.labelHi} सफलतापूर्वक दिया गया!`
            ));
            onPostChange?.();
        } catch (error: any) {
            const msg = error?.message || "";
            if (msg.includes("Insufficient")) {
                toast.error(t("Insufficient wallet balance", "वॉलेट में पर्याप्त राशि नहीं है"));
            } else if (msg.includes("own post")) {
                toast.error(t("Cannot gift to your own post", "अपनी ही पोस्ट पर उपहार नहीं दे सकते"));
            } else {
                toast.error(t("Failed to process gift", "उपहार देने में विफल"));
            }
            console.error("Anshdaan error:", error);
        } finally {
            setIsProcessing(false);
            setSelectedReward(null);
        }
    };

    if (!profile || isOwner) return null;

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-3 rounded-full text-muted-foreground hover:bg-amber-50 hover:text-amber-600 transition-all group"
                    >
                        <span className="inline-block group-hover:animate-bounce transition-transform text-base">
                            🎁
                        </span>
                        <span className="text-xs font-medium hidden sm:inline">
                            {t("Anshdaan", "अंशदान")}
                        </span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="start" sideOffset={8}>
                    <p className="text-xs font-semibold text-muted-foreground px-2 pb-2 border-b border-border/50 mb-2">
                        {t("Gift a reward", "एक उपहार दें")} ✨
                    </p>
                    <div className="flex gap-1">
                        {REWARD_TIERS.map((tier) => (
                            <button
                                key={tier.key}
                                onClick={() => handleSelect(tier)}
                                className="flex flex-col items-center gap-1 p-2.5 rounded-xl hover:bg-accent transition-all hover:scale-110 active:scale-95 cursor-pointer group/tier"
                                title={`${tier.label} — ₹${tier.amount}`}
                            >
                                <span className="text-2xl group-hover/tier:animate-pulse">{tier.emoji}</span>
                                <span className="text-[10px] font-medium text-muted-foreground">
                                    {t(tier.label, tier.labelHi)}
                                </span>
                            </button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>

            <AlertDialog open={!!selectedReward} onOpenChange={(o) => !o && setSelectedReward(null)}>
                <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-xl sm:rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-lg">
                            {selectedReward?.emoji} {t("Gift", "उपहार")} {t(selectedReward?.label || "", selectedReward?.labelHi || "")}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center">
                            {t(
                                `₹${selectedReward?.amount} will be deducted from your Dhan wallet and credited directly to ${post.profiles?.full_name || "the post creator"}'s Dhan wallet.`,
                                `आपके धन वॉलेट से ₹${selectedReward?.amount} कटेगा और सीधे ${post.profiles?.full_name || "पोस्ट बनाने वाले"} के धन वॉलेट में जमा होगा।`
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col gap-2 sm:flex-row mt-2">
                        <AlertDialogCancel disabled={isProcessing} className="mt-0">
                            {t("Cancel", "रद्द करें")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirm();
                            }}
                            disabled={isProcessing}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Gift className="h-4 w-4 mr-2" />
                            )}
                            {t("Confirm Gift", "उपहार दें")}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

/** Display reward badges inline */
export const RewardBadges = ({ rewards }: { rewards?: RewardCounts }) => {
    if (!rewards) return null;
    const entries = REWARD_TIERS.filter((t) => rewards[t.key] > 0);
    if (entries.length === 0) return null;

    return (
        <div className="flex items-center gap-2 px-4 pb-2">
            {entries.map((tier) => (
                <span
                    key={tier.key}
                    className="inline-flex items-center gap-1 text-xs bg-accent/60 rounded-full px-2 py-0.5 font-medium"
                    title={`${rewards[tier.key]} ${tier.label}(s) received`}
                >
                    <span className="text-sm">{tier.emoji}</span>
                    {rewards[tier.key]}
                </span>
            ))}
        </div>
    );
};
