import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Menu, StopCircle, Globe, Loader2, Mic, PhoneOff, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useVanshMitraSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
  useVanshMitraStream,
} from '@/hooks/useVanshMitra';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import ChatMessage from './ChatMessage';
import ChatSessionList from './ChatSessionList';
import type { ChatMessage as ChatMessageType, ChatSession, VanshMitraLanguage } from '@/types/vanshmitra';
import { VANSHMITRA_LANGUAGES } from '@/types/vanshmitra';

export default function VanshMitraChat() {
  const { t, language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const userId = user?.id;

  // ── State ───────────────────────────────────────────────
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  // ── Hooks ───────────────────────────────────────────────
  const { data: sessions = [], isLoading: loadingSessions } = useVanshMitraSessions(userId);
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const { isStreaming, startStream, stopStream } = useVanshMitraStream();
  const liveVoice = useGeminiLive();

  // ── Refs ────────────────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessageType[]>([]);

  // Keep messages ref in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // ── Auto-scroll ─────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // ── Load most recent session or create new one ──────────
  useEffect(() => {
    if (!userId || loadingSessions) return;
    if (sessions.length > 0 && !activeSession) {
      const latest = sessions[0];
      setActiveSession(latest);
      setMessages((latest.messages || []) as ChatMessageType[]);
      // Sync global language with session language if needed, 
      // but user said profiles.language is the main one.
      // So we prioritize profiles.language which is already in 'language' from useLanguage.
    }
  }, [sessions, userId, loadingSessions, activeSession]);

  // ── Session actions ─────────────────────────────────────
  const handleNewSession = useCallback(async () => {
    if (!userId) return;
    try {
      const newSession = await createSession.mutateAsync({
        userId,
        language: language,
      });
      setActiveSession(newSession);
      setMessages([]);
      setShowSessions(false);
    } catch {
      toast.error(t('Failed to create session', 'सत्र बनाने में विफल'));
    }
  }, [userId, language, createSession, t]);

  const handleSelectSession = useCallback((session: ChatSession) => {
    setActiveSession(session);
    setMessages((session.messages || []) as ChatMessageType[]);
    // When selecting a session, we COULD update the global language to the session's language,
    // but the user's requirement is that profiles.language is the main one.
    // For now, we keep the global language as is, but maybe updating it is better UX?
    // User said: "VanshMitra shall respond in the language set in public.profiles"
    // So if I select an old session, VanshMitra will still respond in the CURRENT profile language.
    setShowSessions(false);
  }, []);

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      if (!userId) return;
      try {
        await deleteSession.mutateAsync({ sessionId, userId });
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
          setMessages([]);
        }
        toast.success(t('Session deleted', 'सत्र हटाया गया'));
      } catch {
        toast.error(t('Failed to delete', 'हटाने में विफल'));
      }
    },
    [userId, activeSession, deleteSession, t],
  );

  // ── Save messages to session ────────────────────────────
  const saveMessages = useCallback(
    async (msgs: ChatMessageType[], title?: string) => {
      if (!userId || !activeSession) return;
      try {
        await updateSession.mutateAsync({
          sessionId: activeSession.id,
          userId,
          messages: msgs,
          title,
        });
      } catch {
        // Silent save failure
        console.error('Failed to save messages');
      }
    },
    [userId, activeSession, updateSession],
  );

  // ── Send message ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isStreaming || !userId) return;

    // If no active session, create one first
    let currentSession = activeSession;
    if (!currentSession) {
      try {
        currentSession = await createSession.mutateAsync({
          userId,
          language: language,
        });
        setActiveSession(currentSession);
      } catch {
        toast.error(t('Failed to start session', 'सत्र शुरू करने में विफल'));
        return;
      }
    }

    // Add user message
    const userMsg: ChatMessageType = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInputText('');
    setStreamingText('');

    // Generate title from first user message
    const isFirstMessage = messages.filter((m) => m.role === 'user').length === 0;
    const autoTitle = isFirstMessage ? text.slice(0, 50) + (text.length > 50 ? '…' : '') : undefined;

    // Start streaming
    let fullResponse = '';

    await startStream({
      messages: newMsgs,
      language: language,
      sessionId: currentSession.id,
      onChunk: (chunk) => {
        fullResponse += chunk;
        setStreamingText(fullResponse);
      },
      onDone: () => {
        const assistantMsg: ChatMessageType = {
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date().toISOString(),
        };
        const finalMsgs = [...messagesRef.current, assistantMsg];
        setMessages(finalMsgs);
        setStreamingText('');
        saveMessages(finalMsgs, autoTitle);
      },
      onError: (error) => {
        setStreamingText('');
        if (error === 'no_kundali') {
          toast.error(
            t(
              'Please create your Kundali first',
              'कृपया पहले अपनी कुंडली बनाएं',
            ),
          );
        } else {
          toast.error(error || t('Something went wrong', 'कुछ गलत हो गया'));
        }
      },
    });
  }, [inputText, isStreaming, userId, activeSession, messages, language, createSession, startStream, saveMessages, t]);

  // ── Handle Enter key ────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Live Voice Actions ──────────────────────────────────
  const handleStartVoice = async () => {
    setIsVoiceMode(true);
    await liveVoice.connect();
    if (liveVoice.error) {
      toast.error(liveVoice.error);
      setIsVoiceMode(false);
    }
  };

  const handleEndVoice = () => {
    liveVoice.disconnect();
    setIsVoiceMode(false);
  };

  // ── Welcome state (no messages) ─────────────────────────
  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-130px)] overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-b from-amber-50/30 via-background to-background dark:from-amber-950/20">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-transparent dark:from-amber-950/30 dark:via-orange-950/15 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-saffron/70 hover:text-saffron"
            onClick={() => setShowSessions(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-base font-display font-bold text-foreground/90 flex items-center gap-2">
              <span className="text-lg">🪷</span>
              {t('VanshMitra', 'वंशमित्र')}
            </h2>
            <p className="text-[10px] text-muted-foreground/60 font-medium">
              {t('AI Vedic Astrologer', 'AI वैदिक ज्योतिषी')}
            </p>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-muted-foreground/50" />
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-[120px] h-8 text-xs border-gold/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VANSHMITRA_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs">
                  {lang.nativeLabel} ({lang.label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        {/* Welcome state */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12"
            >
              {/* Guru avatar large */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-gold/20 via-saffron/15 to-gold-light/20 animate-glow blur-md" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-4xl shadow-gold border-4 border-gold-light/30">
                  🪷
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-display font-bold text-gradient-saffron">
                  Jay Shree Krishna! 🙏
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {t(
                    'We are VanshMitra, your personal Vedic astrologer. Ask us about your career, relationships, health, or any life guidance — we shall consult your birth chart and illuminate your path.',
                    'हम वंशमित्र हैं, आपके व्यक्तिगत वैदिक ज्योतिषी। करियर, रिश्ते, स्वास्थ्य या जीवन के किसी भी प्रश्न के बारे में पूछें — हम आपकी कुंडली का अध्ययन करके आपका मार्गदर्शन करेंगे।',
                  )}
                </p>
              </div>

              {/* Quick question suggestions */}
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {[
                  t('What does my career look like?', 'मेरा करियर कैसा रहेगा?'),
                  t('When is a good time for marriage?', 'विवाह का शुभ समय कब है?'),
                  t('What are my current Dasha effects?', 'मेरी वर्तमान दशा का प्रभाव क्या है?'),
                ].map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs border-saffron/20 hover:bg-saffron/5 hover:border-saffron/40 text-muted-foreground hover:text-foreground transition-all"
                    onClick={() => {
                      setInputText(q);
                      inputRef.current?.focus();
                    }}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        {messages.map((msg, idx) => (
          <ChatMessage key={`${msg.timestamp}-${idx}`} message={msg} />
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <ChatMessage
            message={{
              role: 'assistant',
              content: streamingText,
              timestamp: new Date().toISOString(),
            }}
            isStreaming={true}
          />
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Voice Mode Overlay ─────────────────────────────── */}
      <AnimatePresence>
        {isVoiceMode && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-20 bg-background flex flex-col items-center justify-between py-12 px-6"
          >
            <div className="flex flex-col items-center gap-6 mt-12 w-full max-w-md mx-auto">
              {/* Pulsating Avatar */}
              <div className="relative">
                {liveVoice.isSpeaking && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -inset-8 rounded-full bg-saffron/30 blur-xl"
                  />
                )}
                {liveVoice.isConnected && !liveVoice.isSpeaking && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.2 }}
                    animate={{ scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -inset-6 rounded-full bg-saffron/20 blur-lg"
                  />
                )}
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-6xl shadow-gold border-4 border-gold-light/30">
                  🪷
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-display font-bold text-foreground">
                  {liveVoice.isConnected ? t('VanshMitra is listening...', 'वंशमित्र सुन रहे हैं...') : t('Connecting...', 'कनेक्ट हो रहा है...')}
                </h3>
                <p className="text-muted-foreground">
                  {liveVoice.isSpeaking ? (
                    <span className="flex items-center justify-center gap-2 text-saffron font-medium">
                      <Activity className="h-4 w-4 animate-pulse" /> {t('Speaking', 'बोल रहे हैं')}
                    </span>
                  ) : liveVoice.isConnected ? (
                    t('Speak naturally. The AI will respond verbally.', 'स्वाभाविक रूप से बोलें। AI मौखिक रूप से जवाब देगा।')
                  ) : (
                    t('Initializing sacred connection...', 'पवित्र कनेक्शन स्थापित किया जा रहा है...')
                  )}
                </p>
              </div>

              {/* Real-time transcript preview */}
              <div className="w-full h-32 mt-8 p-4 rounded-xl bg-muted/30 border border-gold/10 overflow-y-auto">
                <p className="text-sm italic text-muted-foreground/80 text-center">
                  {liveVoice.transcript || (liveVoice.isConnected ? t('Waiting for conversation...', 'बातचीत की प्रतीक्षा कर रहा है...') : '')}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="pb-8 w-full max-w-sm mx-auto">
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndVoice}
                className="w-full h-14 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center gap-3"
              >
                <PhoneOff className="h-6 w-6" />
                {t('End Call', 'कॉल समाप्त करें')}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ──────────────────────────────────── */}
      <div className="shrink-0 border-t border-gold/15 bg-background/80 backdrop-blur-sm px-3 py-3">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(
              'Ask VanshMitra about your life path…',
              'वंशमित्र से अपने जीवन पथ के बारे में पूछें…',
            )}
            disabled={isStreaming}
            className="flex-1 border-saffron/20 focus:border-saffron focus:ring-saffron/20 h-11 text-sm"
          />
          {isStreaming ? (
            <Button
              onClick={stopStream}
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0 border-destructive/30 hover:bg-destructive/10 text-destructive"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!inputText.trim() || isStreaming}
              size="icon"
              className="h-11 w-11 shrink-0 bg-gradient-saffron hover:opacity-90 text-white shadow-saffron"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={handleStartVoice}
            disabled={isStreaming}
            size="icon"
            variant="outline"
            className="h-11 w-11 shrink-0 border-saffron/30 hover:bg-saffron/10 text-saffron"
            title={t('Live Voice Mode', 'लाइव वॉयस मोड')}
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* ── Sessions sidebar overlay ───────────────────── */}
      <AnimatePresence>
        {showSessions && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-black/20 backdrop-blur-[2px]"
              onClick={() => setShowSessions(false)}
            />
            <ChatSessionList
              sessions={sessions}
              activeSessionId={activeSession?.id ?? null}
              onSelectSession={handleSelectSession}
              onNewSession={handleNewSession}
              onDeleteSession={handleDeleteSession}
              onClose={() => setShowSessions(false)}
              isCreating={createSession.isPending}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
