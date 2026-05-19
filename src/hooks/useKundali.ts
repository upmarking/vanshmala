// ============================================================
// Vedic Kundali — React hooks (TanStack Query)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchAyanamsaOptions,
  fetchMuhurtaPurposes,
  calculateKundali,
  calculatePanchang,
  findMuhurta,
  searchLocation,
  getTimezone,
} from '@/lib/kundaliApi';

import type {
  KundaliCalculateRequest,
  PanchangRequest,
  MuhurtaRequest,
  KundaliInputRow,
  KundaliResultRow,
  KundaliResult,
} from '@/types/kundali';

// ── Static data (cached for session lifetime) ───────────────

export function useAyanamsaOptions() {
  return useQuery({
    queryKey: ['ayanamsa-options'],
    queryFn: fetchAyanamsaOptions,
    staleTime: Infinity,
  });
}

export function useMuhurtaPurposes() {
  return useQuery({
    queryKey: ['muhurta-purposes'],
    queryFn: fetchMuhurtaPurposes,
    staleTime: Infinity,
  });
}

// ── Calculation mutations ───────────────────────────────────

export function useCalculateKundali() {
  return useMutation({
    mutationFn: (params: KundaliCalculateRequest) => calculateKundali(params),
  });
}

export function useCalculatePanchang() {
  return useMutation({
    mutationFn: (params: PanchangRequest) => calculatePanchang(params),
  });
}

export function useFindMuhurta() {
  return useMutation({
    mutationFn: (params: MuhurtaRequest) => findMuhurta(params),
  });
}

export function useLocationSearch(query: string) {
  return useQuery({
    queryKey: ['location-search', query],
    queryFn: () => searchLocation(query),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTimezone() {
  return useMutation({
    mutationFn: ({ lat, lon }: { lat: number; lon: number }) => getTimezone(lat, lon),
  });
}


// ── Supabase persistence ────────────────────────────────────

export function useSavedKundalis(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-kundalis', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kundali_inputs' as any)
        .select('*')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KundaliInputRow[];
    },
  });
}

export function useSavedKundaliResults(inputId: string | undefined) {
  return useQuery({
    queryKey: ['kundali-results', inputId],
    enabled: !!inputId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kundali_results' as any)
        .select('*')
        .eq('input_id', inputId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as KundaliResultRow[];
    },
  });
}

interface SaveKundaliPayload {
  userId: string;
  input: Omit<KundaliInputRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
  result: KundaliResult;
  calcType: 'kundali' | 'panchang' | 'muhurta';
}

export function useSaveKundali() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, input, result, calcType }: SaveKundaliPayload) => {
      // 1. Upsert the input record (indexed by user_id for single-user focus)
      // Check if user already has an input record
      const { data: existingInputs } = await supabase
        .from('kundali_inputs' as any)
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      
      const existingId = existingInputs?.[0]?.id;

      const { data: inputRow, error: inputErr } = await supabase
        .from('kundali_inputs' as any)
        .upsert({
          ...(existingId ? { id: existingId } : {}),
          user_id: userId,
          name: input.name,
          birth_date: input.birth_date,
          birth_time: input.birth_time,
          latitude: input.latitude,
          longitude: input.longitude,
          timezone: input.timezone,
          place_name: input.place_name,
          ayanamsa: input.ayanamsa,
          language: input.language,
        } as any)
        .select()
        .single();
      
      if (inputErr) throw inputErr;

      // 2. Upsert the result record
      const row = inputRow as any;
      
      // Check for existing result of this type
      const { data: existingResults } = await supabase
        .from('kundali_results' as any)
        .select('id')
        .eq('user_id', userId)
        .eq('calc_type', calcType)
        .limit(1);
      
      const resultId = existingResults?.[0]?.id;

      const { error: resultErr } = await supabase
        .from('kundali_results' as any)
        .upsert({
          ...(resultId ? { id: resultId } : {}),
          input_id: row.id,
          user_id: userId,
          calc_type: calcType,
          result_data: result,
        } as any);

      
      if (resultErr) throw resultErr;

      return row as unknown as KundaliInputRow;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['saved-kundalis', vars.userId] });
    },
  });
}


export function useDeleteKundali() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Cascade will delete results too
      const { error } = await supabase
        .from('kundali_inputs' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['saved-kundalis', vars.userId] });
    },
  });
}
