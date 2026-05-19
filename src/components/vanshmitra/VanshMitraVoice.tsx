import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Mic, MicOff, PhoneOff, Activity, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useGeminiLive, type TranscriptEntry } from '@/hooks/useGeminiLive';
import { VANSHMITRA_LANGUAGES } from '@/types/vanshmitra';

// ── Audio waveform bars component ──────────────────────────────
function AudioWaveform({ volume, active }: { volume: number; active: boolean }) {
  const barCount = 5;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const baseHeight = 8;
    const maxExtraHeight = 32;
    // Create a wave pattern — center bars are taller
    const centerFactor = 1 - Math.abs(i - Math.floor(barCount / 2)) / Math.floor(barCount / 2);
    const dynamicHeight = active
      ? baseHeight + maxExtraHeight * volume * (0.5 + 0.5 * centerFactor)
      : baseHeight;
    return dynamicHeight;
  });

  return (
    <div className="flex items-center justify-center gap-1">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          animate={{ height }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="w-1 rounded-full bg-gradient-to-t from-saffron to-gold"
          style={{ minHeight: 8 }}
        />
      ))}
    </div>
  );
}

// ── Transcript line component ──────────────────────────────────
function TranscriptLine({ entry }: { entry: TranscriptEntry }) {
  const isUser = entry.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-saffron/10 text-foreground/80 rounded-br-sm'
            : 'bg-muted/50 text-foreground/90 rounded-bl-sm'
        }`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider block mb-0.5 opacity-50">
          {isUser ? 'You' : 'VanshMitra'}
        </span>
        {entry.text}
      </div>
    </div>
  );
}

// ── Main Voice Component ───────────────────────────────────────
export default function VanshMitraVoice() {
  const { t, language, setLanguage } = useLanguage();
  const live = useGeminiLive();
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [live.transcript]);

  // Show error toasts
  useEffect(() => {
    if (live.error) {
      toast.error(live.error);
    }
  }, [live.error]);

  const handleStart = async () => {
    await live.connect();
  };

  const handleEnd = () => {
    live.disconnect();
  };

  // ── Idle State (Not Connected) ───────────────────────────────
  if (!live.isConnected && !live.isConnecting) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-130px)] overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-b from-amber-50/30 via-background to-background dark:from-amber-950/20">
        {/* Header with language selector */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gold/15 bg-gradient-to-r from-amber-50/60 via-orange-50/30 to-transparent dark:from-amber-950/30 dark:via-orange-950/15 shrink-0">
          <div className="flex items-center gap-3">
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

        {/* Welcome / Idle content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 px-6 py-12">
          {/* Mandala + Avatar */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-8 rounded-full border-2 border-dashed border-gold/20"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 180, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-5 rounded-full border border-saffron/15"
            />
            <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-gold/20 via-saffron/15 to-gold-light/20 animate-pulse blur-md" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-5xl shadow-lg border-4 border-gold-light/30">
              🪷
            </div>
          </div>

          <div className="space-y-3 max-w-md">
            <h3 className="text-2xl font-display font-bold text-gradient-saffron">
              Jay Shree Krishna! 🙏
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                'We are VanshMitra, your personal Vedic astrologer. Tap below to begin a live voice consultation — ask us about your career, relationships, health, or any life guidance.',
                'हम वंशमित्र हैं, आपके व्यक्तिगत वैदिक ज्योतिषी। नीचे टैप करके लाइव वॉयस परामर्श शुरू करें — करियर, रिश्ते, स्वास्थ्य या जीवन मार्गदर्शन पूछें।',
              )}
            </p>
          </div>

          {/* Start button */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          >
            <Button
              size="lg"
              onClick={handleStart}
              className="h-16 px-10 rounded-full text-lg font-semibold bg-gradient-to-r from-saffron to-gold hover:opacity-90 text-white shadow-lg shadow-saffron/30 transition-all duration-300 gap-3"
            >
              <Mic className="h-6 w-6" />
              {t('Begin Consultation', 'परामर्श शुरू करें')}
            </Button>
          </motion.div>

          <p className="text-[11px] text-muted-foreground/50">
            {t(
              'Microphone access required. Your voice is processed securely.',
              'माइक्रोफ़ोन एक्सेस आवश्यक है। आपकी आवाज़ सुरक्षित रूप से संसाधित होती है।',
            )}
          </p>
        </div>
      </div>
    );
  }

  // ── Active / Connecting State ────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-130px)] overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-b from-slate-950/5 via-background to-background dark:from-amber-950/30">
      {/* Compact header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gold/15 bg-background/60 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">🪷</span>
          <span className="text-sm font-display font-bold text-foreground/80">
            {t('VanshMitra', 'वंशमित्र')}
          </span>
          {/* Connection status dot */}
          <span className={`w-2 h-2 rounded-full ${live.isConnected ? 'bg-emerald-500' : 'bg-yellow-500 animate-pulse'}`} />
        </div>
        <div className="flex items-center gap-2">
          <Globe className="h-3 w-3 text-muted-foreground/40" />
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger className="w-[100px] h-7 text-[11px] border-gold/15">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VANSHMITRA_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs">
                  {lang.nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main voice area */}
      <div className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-12 px-4 overflow-hidden">
        {/* Avatar with audio-reactive glow */}
        <div className="relative mb-6">
          {/* Outermost mandala ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-10 rounded-full border border-dashed border-gold/15"
          />

          {/* Audio-reactive glow */}
          <AnimatePresence>
            {live.isSpeaking && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: [1, 1.15 + live.volume * 0.5, 1],
                  opacity: [0.3, 0.6 + live.volume * 0.3, 0.3],
                }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute -inset-8 rounded-full bg-saffron/25 blur-xl"
              />
            )}
          </AnimatePresence>

          {/* Listening pulse (when not speaking) */}
          {live.isConnected && !live.isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.06, 1],
                opacity: [0.15, 0.3, 0.15],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute -inset-6 rounded-full bg-saffron/15 blur-lg"
            />
          )}

          {/* Avatar circle */}
          <div className="relative w-32 h-32 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-saffron to-gold flex items-center justify-center text-6xl shadow-lg border-4 border-gold-light/30">
            {live.isConnecting ? (
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            ) : (
              '🪷'
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-1.5 mb-4">
          <h3 className="text-lg md:text-xl font-display font-bold text-foreground/90">
            {live.isConnecting
              ? t('Connecting…', 'कनेक्ट हो रहा है…')
              : live.isSpeaking
                ? t('VanshMitra is speaking', 'वंशमित्र बोल रहे हैं')
                : live.isMuted
                  ? t('Microphone muted', 'माइक्रोफ़ोन म्यूट है')
                  : t('Listening…', 'सुन रहे हैं…')}
          </h3>
          {live.isSpeaking && (
            <div className="flex justify-center">
              <AudioWaveform volume={live.volume} active={live.isSpeaking} />
            </div>
          )}
          {!live.isSpeaking && live.isConnected && !live.isMuted && (
            <p className="text-xs text-muted-foreground/60">
              {t('Speak naturally — VanshMitra will respond', 'स्वाभाविक रूप से बोलें — वंशमित्र जवाब देंगे')}
            </p>
          )}
        </div>

        {/* Live transcript panel */}
        {live.transcript.length > 0 && showTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md flex-1 min-h-0 mb-4"
          >
            <div className="h-full flex flex-col rounded-xl border border-gold/10 bg-muted/20 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gold/10">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  {t('Live Transcript', 'लाइव ट्रांसक्रिप्ट')}
                </span>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
                >
                  {t('Hide', 'छुपाएं')}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {live.transcript.map((entry, idx) => (
                  <TranscriptLine key={`${entry.role}-${idx}`} entry={entry} />
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </motion.div>
        )}

        {!showTranscript && live.transcript.length > 0 && (
          <button
            onClick={() => setShowTranscript(true)}
            className="text-xs text-saffron/60 hover:text-saffron/80 transition-colors mb-4 underline underline-offset-2"
          >
            {t('Show transcript', 'ट्रांसक्रिप्ट दिखाएं')}
          </button>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-4 pb-6 pt-3">
        <div className="flex items-center justify-center gap-4 max-w-sm mx-auto">
          {/* Mute toggle */}
          <Button
            onClick={live.toggleMute}
            size="icon"
            variant="outline"
            className={`h-14 w-14 rounded-full border-2 transition-all duration-200 ${
              live.isMuted
                ? 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'border-gold/20 bg-background text-saffron hover:bg-saffron/10'
            }`}
          >
            {live.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          {/* End call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEnd}
            className="h-14 px-8 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
          >
            <PhoneOff className="h-5 w-5" />
            {t('End Call', 'कॉल समाप्त करें')}
          </Button>
        </div>
      </div>
    </div>
  );
}
