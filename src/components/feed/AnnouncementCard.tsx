
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface AnnouncementCardProps {
  subType: string;
  content: string;
  authorName?: string;
}

const themes = {
  achievement: {
    collapsed: "bg-gradient-to-br from-[hsl(40,85%,38%)] via-[hsl(42,78%,50%)] to-[hsl(40,85%,38%)]",
    expanded: "bg-gradient-to-br from-[hsl(42,55%,93%)] via-[hsl(40,40%,96%)] to-[hsl(42,50%,90%)]",
    border: "border-[hsl(42,78%,55%)]",
    icon: "🏆",
    label: "Achievement",
    headerText: "🌟 Proud Moment 🌟",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
  },
  celebration: {
    collapsed: "bg-gradient-to-br from-[hsl(280,55%,50%)] via-[hsl(320,50%,55%)] to-[hsl(25,85%,52%)]",
    expanded: "bg-gradient-to-br from-[hsl(280,35%,95%)] via-[hsl(320,30%,96%)] to-[hsl(25,40%,94%)]",
    border: "border-[hsl(320,50%,55%)]",
    icon: "🎉",
    label: "Celebration",
    headerText: "🥳 Let's Celebrate! 🥳",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
  },
  donation: {
    collapsed: "bg-gradient-to-br from-[hsl(140,40%,35%)] via-[hsl(150,35%,40%)] to-[hsl(130,45%,30%)]",
    expanded: "bg-gradient-to-br from-[hsl(140,30%,94%)] via-[hsl(150,25%,96%)] to-[hsl(140,30%,92%)]",
    border: "border-[hsl(140,40%,35%)]",
    icon: "🙏",
    label: "Donation",
    headerText: "🙏 सेवा & दान 🙏",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
  },
};

export const AnnouncementCard = ({ subType, content, authorName }: AnnouncementCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = themes[subType as keyof typeof themes];

  if (!theme) return null;

  return (
    <div className="px-4 pb-3">
      <motion.div
        className={`rounded-xl border-2 ${theme.border} overflow-hidden cursor-pointer select-none`}
        onClick={() => setIsExpanded(!isExpanded)}
        layout
      >
        {/* Collapsed tile */}
        <div className={`relative ${theme.collapsed} px-5 py-4`}>
          {/* Shimmer for achievement */}
          {subType === "achievement" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                  animation: "shimmer 3s infinite",
                }}
              />
            </div>
          )}

          {/* Confetti for celebration */}
          {subType === "celebration" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-sm opacity-25"
                  style={{
                    width: `${5 + (i % 3) * 3}px`,
                    height: `${5 + (i % 3) * 3}px`,
                    top: `${8 + (i * 14) % 80}%`,
                    left: `${5 + (i * 16) % 90}%`,
                    background: ["#ffd700", "#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#ff69b4"][i],
                    transform: `rotate(${i * 45}deg)`,
                  }}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.icon}</span>
              <div>
                <p className={`font-bold text-base ${theme.textColor}`}>{theme.label}</p>
                <p className={`text-xs ${theme.textColor} opacity-80`}>
                  {authorName ? `By ${authorName}` : "Announcement"}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className={`h-5 w-5 ${theme.textColor} opacity-70`} />
            </motion.div>
          </div>

          {!isExpanded && (
            <p className={`text-xs ${theme.textColor} opacity-60 mt-2 text-center`}>
              Tap to view
            </p>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className={`${theme.expanded} px-5 py-4`}>
                <p className={`text-center text-sm font-semibold ${theme.expandedText} opacity-70 mb-3`}>
                  {theme.headerText}
                </p>
                <div className="w-12 mx-auto border-t border-current opacity-20 mb-3" />
                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.expandedText}`}>
                  {content}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
