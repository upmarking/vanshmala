
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface InviteCardProps {
  subType: string;
  content: string;
  authorName?: string;
}

const themes = {
  marriage: {
    collapsed: "bg-gradient-to-br from-[hsl(25,85%,52%)] via-[hsl(42,78%,55%)] to-[hsl(15,80%,38%)]",
    expanded: "bg-gradient-to-br from-[hsl(42,65%,92%)] via-[hsl(30,40%,96%)] to-[hsl(42,65%,88%)]",
    border: "border-[hsl(42,78%,55%)]",
    icon: "🕉",
    label: "शुभ विवाह",
    subtitle: "Marriage Invitation",
    headerText: "॥ श्री गणेशाय नमः ॥",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
    decorLeft: "✦",
    decorRight: "✦",
  },
  birthday: {
    collapsed: "bg-gradient-to-br from-[hsl(280,60%,55%)] via-[hsl(320,55%,60%)] to-[hsl(340,65%,60%)]",
    expanded: "bg-gradient-to-br from-[hsl(320,40%,95%)] via-[hsl(280,30%,96%)] to-[hsl(340,40%,93%)]",
    border: "border-[hsl(320,55%,60%)]",
    icon: "🎂",
    label: "Happy Birthday!",
    subtitle: "Birthday Invitation",
    headerText: "🎉 You're Invited! 🎉",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
    decorLeft: "🎈",
    decorRight: "🎈",
  },
  festival: {
    collapsed: "bg-gradient-to-br from-[hsl(30,80%,50%)] via-[hsl(42,75%,52%)] to-[hsl(15,70%,45%)]",
    expanded: "bg-gradient-to-br from-[hsl(42,60%,93%)] via-[hsl(30,45%,96%)] to-[hsl(42,55%,90%)]",
    border: "border-[hsl(30,80%,50%)]",
    icon: "🪔",
    label: "Festival Celebration",
    subtitle: "Festival Invitation",
    headerText: "✨ शुभ अवसर ✨",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
    decorLeft: "🪔",
    decorRight: "🪔",
  },
  casual: {
    collapsed: "bg-gradient-to-br from-[hsl(210,50%,50%)] via-[hsl(200,45%,55%)] to-[hsl(220,55%,45%)]",
    expanded: "bg-gradient-to-br from-[hsl(210,30%,95%)] via-[hsl(200,25%,97%)] to-[hsl(210,30%,93%)]",
    border: "border-[hsl(210,50%,50%)]",
    icon: "📨",
    label: "Invitation",
    subtitle: "You're Invited",
    headerText: "You're Invited!",
    textColor: "text-white",
    expandedText: "text-[hsl(20,40%,10%)]",
    decorLeft: "·",
    decorRight: "·",
  },
};

export const InviteCard = ({ subType, content, authorName }: InviteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = themes[subType as keyof typeof themes] || themes.casual;

  return (
    <div className="px-4 pb-3">
      <motion.div
        className={`rounded-xl border-2 ${theme.border} overflow-hidden cursor-pointer select-none`}
        onClick={() => setIsExpanded(!isExpanded)}
        layout
      >
        {/* Collapsed tile */}
        <div className={`relative ${theme.collapsed} px-5 py-4`}>
          {/* Decorative corners for marriage */}
          {subType === "marriage" && (
            <>
              <span className="absolute top-1 left-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute top-1 right-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute bottom-1 left-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute bottom-1 right-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
            </>
          )}

          {/* Birthday confetti dots */}
          {subType === "birthday" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <span
                  key={i}
                  className="absolute rounded-full opacity-30"
                  style={{
                    width: `${6 + (i % 3) * 4}px`,
                    height: `${6 + (i % 3) * 4}px`,
                    top: `${10 + (i * 11) % 80}%`,
                    left: `${5 + (i * 13) % 90}%`,
                    background: ["#fff", "#ffd700", "#ff69b4", "#87ceeb"][i % 4],
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
                  {authorName ? `From ${authorName}` : theme.subtitle}
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
              Tap to view {theme.decorLeft} {theme.decorRight}
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
