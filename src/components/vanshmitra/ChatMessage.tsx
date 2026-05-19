import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '@/types/vanshmitra';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

// ── VanshMitra avatar (golden guru) ──────────────────────────
function GuruAvatar() {
  return (
    <div className="relative shrink-0">
      {/* Golden halo glow */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-gold/40 via-saffron/30 to-gold-light/40 animate-glow blur-sm" />
      <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-lg shadow-gold border-2 border-gold-light/50">
        🪷
      </div>
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-saffron/60"
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Simple markdown renderer ─────────────────────────────────
function renderMessageContent(content: string) {
  // Split by double newlines for paragraphs
  const paragraphs = content.split(/\n\n+/);

  return paragraphs.map((para, pi) => {
    // Check if it's a bullet list
    const lines = para.split('\n');
    const isList = lines.every(
      (l) => l.trim().startsWith('- ') || l.trim().startsWith('• ') || l.trim() === '',
    );

    if (isList && lines.filter((l) => l.trim()).length > 0) {
      return (
        <ul key={pi} className="list-disc list-inside space-y-1 my-2">
          {lines
            .filter((l) => l.trim())
            .map((line, li) => (
              <li key={li} className="text-sm leading-relaxed">
                {formatInlineText(line.replace(/^[-•]\s*/, ''))}
              </li>
            ))}
        </ul>
      );
    }

    return (
      <p key={pi} className="text-sm leading-relaxed my-1">
        {formatInlineText(para)}
      </p>
    );
  });
}

function formatInlineText(text: string) {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

// ── Main component ───────────────────────────────────────────
export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
    >
      {/* Avatar — left side for assistant */}
      {isAssistant && <GuruAvatar />}

      {/* Message bubble */}
      <div
        className={`
          relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3
          ${
            isAssistant
              ? 'bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-yellow-50/80 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 border border-gold/20 shadow-soft rounded-tl-md'
              : 'bg-saffron/10 dark:bg-saffron/20 border border-saffron/20 rounded-tr-md'
          }
        `}
      >
        {/* Name label */}
        {isAssistant && (
          <p className="text-[11px] font-bold text-saffron-deep dark:text-gold-light mb-1 tracking-wide uppercase">
            VanshMitra
          </p>
        )}

        {/* Content */}
        <div className="text-foreground/90">
          {message.content ? (
            renderMessageContent(message.content)
          ) : isStreaming ? (
            <TypingIndicator />
          ) : null}
          {isStreaming && message.content && (
            <span className="inline-block w-0.5 h-4 bg-saffron/70 animate-pulse ml-0.5 align-text-bottom" />
          )}
        </div>

        {/* Timestamp */}
        <p
          className={`text-[10px] mt-1.5 ${
            isAssistant ? 'text-muted-foreground/60' : 'text-muted-foreground/60 text-right'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  );
}
