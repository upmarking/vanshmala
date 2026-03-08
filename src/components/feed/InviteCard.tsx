
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CalendarPlus, Clock, Check, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FeedRsvp } from "@/types/feed";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteCardProps {
  subType: string;
  content: string;
  authorName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  postId: string;
  rsvps: FeedRsvp[];
  profileId: string | null;
  onPostChange?: () => void;
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

type RsvpStatus = 'accept' | 'maybe' | 'decline';

function generateCalendarUrl(type: 'google' | 'ics', title: string, content: string, eventDate: string, eventTime?: string | null) {
  const dateObj = new Date(eventDate + 'T' + (eventTime || '00:00') + ':00');
  const endDate = new Date(dateObj.getTime() + 2 * 60 * 60 * 1000);

  const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  if (type === 'google') {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details: content,
      dates: `${formatGoogleDate(dateObj)}/${formatGoogleDate(endDate)}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VanshMala//Event//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatGoogleDate(dateObj)}`,
    `DTEND:${formatGoogleDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${content.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}

export const InviteCard = ({ subType, content, authorName, eventDate, eventTime, postId, rsvps, profileId, onPostChange }: InviteCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRsvpLoading, setIsRsvpLoading] = useState(false);
  const theme = themes[subType as keyof typeof themes] || themes.casual;

  const myRsvp = profileId ? rsvps.find(r => r.profile_id === profileId)?.status : null;
  const acceptCount = rsvps.filter(r => r.status === 'accept').length;
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length;
  const declineCount = rsvps.filter(r => r.status === 'decline').length;

  const handleRsvp = async (e: React.MouseEvent, status: RsvpStatus) => {
    e.stopPropagation();
    if (!profileId) {
      toast.error("You must be logged in to RSVP.");
      return;
    }
    setIsRsvpLoading(true);
    try {
      if (myRsvp === status) {
        // Toggle off
        const { error } = await supabase.rpc('remove_feed_rsvp', {
          p_post_id: postId,
          p_profile_id: profileId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('set_feed_rsvp', {
          p_post_id: postId,
          p_profile_id: profileId,
          p_status: status,
        });
        if (error) throw error;
      }
      onPostChange?.();
    } catch (error) {
      console.error("RSVP error:", error);
      toast.error("Failed to update RSVP.");
    } finally {
      setIsRsvpLoading(false);
    }
  };

  const handleAddToCalendar = (e: React.MouseEvent, type: 'google' | 'ics') => {
    e.stopPropagation();
    if (!eventDate) return;
    const title = `${theme.label} - VanshMala`;
    const url = generateCalendarUrl(type, title, content, eventDate, eventTime);
    if (type === 'google') {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event.ics';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formattedDate = eventDate ? format(new Date(eventDate + 'T00:00:00'), 'PPP') : null;
  const formattedTime = eventTime ? format(new Date(`2000-01-01T${eventTime}`), 'h:mm a') : null;

  const rsvpButtons: { status: RsvpStatus; icon: React.ReactNode; label: string; activeClass: string }[] = [
    { status: 'accept', icon: <Check className="h-3.5 w-3.5" />, label: 'Accept', activeClass: 'bg-green-500 text-white border-green-500 hover:bg-green-600' },
    { status: 'maybe', icon: <HelpCircle className="h-3.5 w-3.5" />, label: 'Maybe', activeClass: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' },
    { status: 'decline', icon: <X className="h-3.5 w-3.5" />, label: 'Decline', activeClass: 'bg-red-500 text-white border-red-500 hover:bg-red-600' },
  ];

  return (
    <div className="px-4 pb-3">
      <motion.div
        className={`rounded-xl border-2 ${theme.border} overflow-hidden cursor-pointer select-none`}
        onClick={() => setIsExpanded(!isExpanded)}
        layout
      >
        {/* Collapsed tile */}
        <div className={`relative ${theme.collapsed} px-5 py-4`}>
          {subType === "marriage" && (
            <>
              <span className="absolute top-1 left-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute top-1 right-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute bottom-1 left-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
              <span className="absolute bottom-1 right-2 text-[hsl(42,78%,75%)] text-lg opacity-60">❈</span>
            </>
          )}

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
            <div className="flex items-center gap-2">
              {formattedDate && (
                <div className={`text-right ${theme.textColor} opacity-90`}>
                  <p className="text-xs font-medium">{formattedDate}</p>
                  {formattedTime && <p className="text-[10px] opacity-80">{formattedTime}</p>}
                </div>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className={`h-5 w-5 ${theme.textColor} opacity-70`} />
              </motion.div>
            </div>
          </div>

          {/* RSVP summary on collapsed view */}
          {!isExpanded && (acceptCount + maybeCount > 0) ? (
            <p className={`text-xs ${theme.textColor} opacity-70 mt-2 text-center`}>
              {acceptCount > 0 && `${acceptCount} Attending`}
              {acceptCount > 0 && maybeCount > 0 && ' · '}
              {maybeCount > 0 && `${maybeCount} Maybe`}
              {' · Tap to view'}
            </p>
          ) : !isExpanded ? (
            <p className={`text-xs ${theme.textColor} opacity-60 mt-2 text-center`}>
              Tap to view {theme.decorLeft} {theme.decorRight}
            </p>
          ) : null}
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

                {formattedDate && (
                  <div className={`flex items-center justify-center gap-4 mb-3 ${theme.expandedText}`}>
                    <span className="flex items-center gap-1.5 text-xs font-medium opacity-80">
                      <CalendarPlus className="h-3.5 w-3.5" />
                      {formattedDate}
                    </span>
                    {formattedTime && (
                      <span className="flex items-center gap-1.5 text-xs font-medium opacity-80">
                        <Clock className="h-3.5 w-3.5" />
                        {formattedTime}
                      </span>
                    )}
                  </div>
                )}

                <p className={`text-sm whitespace-pre-wrap leading-relaxed ${theme.expandedText}`}>
                  {content}
                </p>

                {/* RSVP Section */}
                <div className="mt-4 pt-3 border-t border-current/10">
                  {/* RSVP Counts */}
                  {(acceptCount + maybeCount + declineCount) > 0 && (
                    <div className={`flex items-center justify-center gap-3 mb-3 text-xs font-medium ${theme.expandedText} opacity-70`}>
                      {acceptCount > 0 && <span className="flex items-center gap-1"><Check className="h-3 w-3 text-green-600" />{acceptCount} Attending</span>}
                      {maybeCount > 0 && <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3 text-amber-600" />{maybeCount} Maybe</span>}
                      {declineCount > 0 && <span className="flex items-center gap-1"><X className="h-3 w-3 text-red-600" />{declineCount} Declined</span>}
                    </div>
                  )}

                  {/* RSVP Buttons */}
                  <div className="flex gap-2 justify-center">
                    {rsvpButtons.map(({ status, icon, label, activeClass }) => (
                      <Button
                        key={status}
                        variant="outline"
                        size="sm"
                        className={`text-xs gap-1.5 rounded-full transition-all ${
                          myRsvp === status
                            ? activeClass
                            : 'border-border/50 hover:bg-muted/50'
                        }`}
                        onClick={(e) => handleRsvp(e, status)}
                        disabled={isRsvpLoading}
                      >
                        {icon}
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Add to Calendar buttons */}
                {eventDate && (
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 rounded-full border-primary/30 hover:bg-primary/5"
                      onClick={(e) => handleAddToCalendar(e, 'google')}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Google Calendar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 rounded-full border-primary/30 hover:bg-primary/5"
                      onClick={(e) => handleAddToCalendar(e, 'ics')}
                    >
                      <CalendarPlus className="h-3.5 w-3.5" />
                      Download .ics
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
