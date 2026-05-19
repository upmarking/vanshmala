// ============================================================
// VanshMitra AI Astrologer — React hooks
// ============================================================

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ChatMessage, ChatSession, VanshMitraLanguage } from '@/types/vanshmitra';

// ── Kundali Gate ─────────────────────────────────────────────

export function useKundaliGate(userId: string | undefined) {
  return useQuery({
    queryKey: ['kundali-gate', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kundali_inputs' as any)
        .select('id')
        .eq('user_id', userId!)
        .limit(1);
      if (error) throw error;
      return { hasKundali: (data?.length ?? 0) > 0 };
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });
}

// ── Chat Sessions ────────────────────────────────────────────

export function useVanshMitraSessions(userId: string | undefined) {
  return useQuery({
    queryKey: ['vanshmitra-sessions', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vanshmitra_chat_sessions' as any)
        .select('*')
        .eq('user_id', userId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ChatSession[];
    },
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      language,
    }: {
      userId: string;
      language: VanshMitraLanguage;
    }) => {
      const { data, error } = await supabase
        .from('vanshmitra_chat_sessions' as any)
        .insert({
          user_id: userId,
          title: 'New Consultation',
          language,
          messages: [],
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChatSession;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['vanshmitra-sessions', vars.userId],
      });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
      messages,
      title,
    }: {
      sessionId: string;
      userId: string;
      messages: ChatMessage[];
      title?: string;
    }) => {
      const update: Record<string, unknown> = { messages };
      if (title) update.title = title;

      const { error } = await supabase
        .from('vanshmitra_chat_sessions' as any)
        .update(update as any)
        .eq('id', sessionId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['vanshmitra-sessions', vars.userId],
      });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
    }: {
      sessionId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('vanshmitra_chat_sessions' as any)
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['vanshmitra-sessions', vars.userId],
      });
    },
  });
}

// ── Gemini Streaming ─────────────────────────────────────────

interface StreamOptions {
  messages: ChatMessage[];
  language: VanshMitraLanguage;
  sessionId?: string;
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export function useVanshMitraStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async ({ messages, language, sessionId, onChunk, onDone, onError }: StreamOptions) => {
      // Abort any existing stream
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          onError('Not authenticated');
          setIsStreaming(false);
          return;
        }

        // Build the Edge Function URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_RAW_URL || 'https://qngfdcbccnguftxzecwq.supabase.co';

        const response = await fetch(`${supabaseUrl}/functions/v1/vanshmitra-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            language,
            session_id: sessionId,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          const errMsg =
            (errBody as any).message || (errBody as any).error || `Error ${response.status}`;
          onError(errMsg);
          setIsStreaming(false);
          return;
        }

        // Read the SSE stream
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                onDone();
                setIsStreaming(false);
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  onChunk(parsed.text);
                }
                if (parsed.error) {
                  onError(parsed.error);
                  setIsStreaming(false);
                  return;
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }

        // Process remaining buffer
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) onChunk(parsed.text);
            } catch {
              // Ignore
            }
          }
        }

        onDone();
        setIsStreaming(false);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setIsStreaming(false);
          return;
        }
        onError(err.message || 'Stream failed');
        setIsStreaming(false);
      }
    },
    [],
  );

  const stopStream = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return { isStreaming, startStream, stopStream };
}
