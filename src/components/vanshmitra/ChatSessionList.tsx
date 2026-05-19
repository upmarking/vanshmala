import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageSquare, ChevronLeft, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChatSession } from '@/types/vanshmitra';

interface ChatSessionListProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClose: () => void;
  isCreating?: boolean;
}

export default function ChatSessionList({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClose,
  isCreating,
}: ChatSessionListProps) {
  const { t } = useLanguage();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const getSessionPreview = (session: ChatSession) => {
    const msgs = session.messages || [];
    if (msgs.length === 0) return t('New consultation', 'नई परामर्श');
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) return lastUserMsg.content.slice(0, 60) + (lastUserMsg.content.length > 60 ? '…' : '');
    return t('Consultation', 'परामर्श');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('Just now', 'अभी');
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md flex flex-col border-r border-border/50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-display font-bold text-foreground/90">
          {t('Past Consultations', 'पिछली परामर्श')}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      {/* New chat button */}
      <div className="px-3 py-2">
        <Button
          onClick={onNewSession}
          disabled={isCreating}
          className="w-full bg-gradient-saffron hover:opacity-90 text-white text-sm font-medium h-9 gap-2"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('New Consultation', 'नई परामर्श')}
        </Button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => (
            <motion.div
              key={session.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className={`
                relative group rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200
                ${
                  activeSessionId === session.id
                    ? 'bg-saffron/10 border border-saffron/20'
                    : 'hover:bg-muted/50 border border-transparent'
                }
              `}
              onClick={() => onSelectSession(session)}
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="h-4 w-4 text-saffron/60 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground/90 truncate">
                    {session.title || t('Consultation', 'परामर्श')}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
                    {getSessionPreview(session)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground/40" />
                    <span className="text-[10px] text-muted-foreground/50">
                      {formatDate(session.updated_at)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/40 ml-1">
                      · {(session.messages || []).length} msgs
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {confirmDelete === session.id ? (
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                        setConfirmDelete(null);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(session.id);
                        setTimeout(() => setConfirmDelete(null), 3000);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sessions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground/50">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">{t('No past consultations', 'कोई पिछली परामर्श नहीं')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
