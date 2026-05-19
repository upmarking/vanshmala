import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { supabase } from '@/integrations/supabase/client';

// ── Transcript entry ───────────────────────────────────────────
export interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// ── Hook return type ───────────────────────────────────────────
export interface GeminiLiveState {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  volume: number;
  transcript: TranscriptEntry[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
}

// ── AudioRecorder — captures mic at 16kHz PCM, sends base64 chunks ──
class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onAudioData: (base64Data: string) => void;

  constructor(onAudioData: (base64Data: string) => void) {
    this.onAudioData = onAudioData;
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    this.source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = this.float32ToInt16(inputData);
      const base64Data = this.arrayBufferToBase64(pcmData.buffer);
      this.onAudioData(base64Data);
    };
  }

  stop() {
    this.processor?.disconnect();
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
    this.stream = null;
    this.processor = null;
    this.source = null;
  }

  private float32ToInt16(buffer: Float32Array): Int16Array {
    const l = buffer.length;
    const buf = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      buf[i] = Math.min(1, buffer[i]) * 0x7fff;
    }
    return buf;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

// ── AudioPlayer — plays 24kHz PCM audio chunks from Gemini ──────
class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number = 24000;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.nextStartTime = this.audioContext.currentTime;
  }

  playChunk(base64Data: string) {
    if (!this.audioContext) return;

    const binary = window.atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 0x7fff;
    }

    const buffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate);
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;
  }

  stop() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.nextStartTime = this.audioContext.currentTime;
  }

  destroy() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
  }
}

// ── Compute RMS volume from Base64 PCM ──────────────────────────
function computeVolume(base64: string): number {
  const binary = window.atob(base64);
  let sum = 0;
  for (let i = 0; i < binary.length; i += 2) {
    const val = binary.charCodeAt(i) | (binary.charCodeAt(i + 1) << 8);
    sum += Math.abs(val > 32767 ? val - 65536 : val);
  }
  return sum / (binary.length / 2) / 32768;
}

// ── Main hook ──────────────────────────────────────────────────
export function useGeminiLive(): GeminiLiveState {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<any>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const activeRef = useRef(false);
  const isMutedRef = useRef(false);

  // Keep muted ref in sync
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // ── Cleanup everything ───────────────────────────────────────
  const cleanup = useCallback(() => {
    activeRef.current = false;
    recorderRef.current?.stop();
    recorderRef.current = null;
    playerRef.current?.destroy();
    playerRef.current = null;
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch { /* ignore */ }
    }
    sessionRef.current = null;
    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
    setVolume(0);
  }, []);

  const disconnect = useCallback(() => {
    cleanup();
  }, [cleanup]);

  // ── Connect to Gemini Live directly from browser ─────────────
  const connect = useCallback(async () => {
    try {
      setError(null);
      setTranscript([]);
      setIsConnecting(true);
      setVolume(0);

      // 1. Get Auth Session
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) throw new Error("Not authenticated");

      // 2. Fetch API Key + System Instruction from secure Edge Function
      const { data, error: fnError } = await supabase.functions.invoke('get-gemini-key', {});

      if (fnError) {
        console.error("get-gemini-key error:", fnError);
        // Check if the error message contains a JSON body with details
        const message = typeof fnError.message === 'string' ? fnError.message : '';
        if (message.includes('no_kundali')) {
          throw new Error("No birth details found. Please go to the Kundali page, enter your birth details, and save your chart before connecting to VanshMitra.");
        }
        throw new Error("Failed to retrieve API configurations.");
      }

      if (!data?.apiKey) {
        throw new Error("API key not received from server.");
      }

      const apiKey = atob(data.apiKey);
      const systemInstruction = data.systemInstruction || "";

      // 3. Initialize audio player (pre-create for ready playback)
      playerRef.current = new AudioPlayer();

      // 4. Initialize audio recorder — sends PCM chunks to Gemini session
      recorderRef.current = new AudioRecorder((base64Data) => {
        if (sessionRef.current && activeRef.current && !isMutedRef.current) {
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      });

      // 5. Connect directly to Gemini Live from the browser
      const ai = new GoogleGenAI({ apiKey });

      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
          onopen: () => {
            console.log('[VanshMitra] Gemini Live Session Opened');
            activeRef.current = true;
            setIsConnected(true);
            setIsConnecting(false);

            // Start mic recording immediately
            recorderRef.current?.start();
          },
          onmessage: (message: any) => {
            // ── Handle audio output ──────────────────────────
            const audioParts = message.serverContent?.modelTurn?.parts || [];
            for (const part of audioParts) {
              const base64Audio = part.inlineData?.data;
              if (base64Audio && part.inlineData?.mimeType?.startsWith('audio/pcm')) {
                setIsSpeaking(true);
                playerRef.current?.playChunk(base64Audio);

                // Compute volume for waveform visualization
                const vol = computeVolume(base64Audio);
                setVolume(vol);
              }

              // ── Model text transcript from modelTurn ────────
              if (part.text) {
                setTranscript((prev) => {
                  const last = prev[prev.length - 1];
                  if (last && last.role === 'model') {
                    const updated = [...prev];
                    updated[updated.length - 1] = {
                      ...last,
                      text: last.text + part.text,
                    };
                    return updated;
                  }
                  return [
                    ...prev,
                    { role: 'model', text: part.text, timestamp: new Date().toISOString() },
                  ];
                });
              }
            }

            // ── Handle user input audio transcription ────────
            const userTranscription = message.serverContent?.inputAudioTranscription?.text;
            if (userTranscription && userTranscription.trim()) {
              setTranscript((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'user') {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    text: last.text + userTranscription,
                  };
                  return updated;
                }
                return [
                  ...prev,
                  { role: 'user', text: userTranscription, timestamp: new Date().toISOString() },
                ];
              });
            }

            // ── Handle model output audio transcription ──────
            const modelTranscription = message.serverContent?.outputAudioTranscription?.text;
            if (modelTranscription && modelTranscription.trim()) {
              setTranscript((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === 'model') {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...last,
                    text: last.text + modelTranscription,
                  };
                  return updated;
                }
                return [
                  ...prev,
                  { role: 'model', text: modelTranscription, timestamp: new Date().toISOString() },
                ];
              });
            }

            // ── Handle turn complete ─────────────────────────
            if (message.serverContent?.turnComplete) {
              setIsSpeaking(false);
              setVolume(0);
            }

            // ── Handle interruption ──────────────────────────
            if (message.serverContent?.interrupted) {
              playerRef.current?.stop();
              setIsSpeaking(false);
              setVolume(0);
            }
          },
          onclose: () => {
            console.log('[VanshMitra] Gemini Live Session Closed');
            cleanup();
          },
          onerror: (e: any) => {
            console.error('[VanshMitra] Gemini Live Session Error:', e);
            setError('Voice connection error. Please try again.');
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
          },
          systemInstruction: systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });

      // CRITICAL: Await session ONCE, store resolved reference for zero-latency sends
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error('[VanshMitra] Connect error:', err);
      setError(err.message || 'Failed to start live session');
      setIsConnecting(false);
      cleanup();
    }
  }, [cleanup]);

  // ── Mute/Unmute toggle ───────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    isMuted,
    volume,
    transcript,
    error,
    connect,
    disconnect,
    toggleMute,
  };
}
