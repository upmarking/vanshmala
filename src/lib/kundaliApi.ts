// ============================================================
// Vedic Kundali — API service layer
// Wraps the free VedicPanchanga.com public API
// ============================================================

import type {
  KundaliCalculateRequest,
  KundaliResult,
  PanchangRequest,
  PanchangResult,
  MuhurtaRequest,
  MuhurtaResult,
  AyanamsaOption,
  MuhurtaPurpose,
} from '@/types/kundali';

const API_BASE = '/astro-proxy';
console.log('Kundali API Base:', API_BASE);

/**
 * Generic fetch helper with JSON error handling.
 */
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────────
// Static data endpoints (cached by React Query)
// ──────────────────────────────────────────────

export function fetchAyanamsaOptions(): Promise<AyanamsaOption[]> {
  return apiFetch<AyanamsaOption[]>(`${API_BASE}/ayanamsa-options`);
}

export function fetchMuhurtaPurposes(): Promise<MuhurtaPurpose[]> {
  return apiFetch<MuhurtaPurpose[]>(`${API_BASE}/muhurta-purposes`);
}

// ──────────────────────────────────────────────
// Calculation endpoints
// ──────────────────────────────────────────────

export function calculateKundali(params: KundaliCalculateRequest): Promise<KundaliResult> {
  return apiFetch<KundaliResult>(`${API_BASE}/calculate`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function calculatePanchang(params: PanchangRequest): Promise<PanchangResult> {
  const query = new URLSearchParams();
  query.set('latitude', String(params.latitude));
  query.set('longitude', String(params.longitude));
  if (params.date) query.set('date', params.date);
  if (params.timezone) query.set('timezone', params.timezone);
  return apiFetch<PanchangResult>(`${API_BASE}/get-panchang?${query.toString()}`);
}

export function findMuhurta(params: MuhurtaRequest): Promise<MuhurtaResult> {
  return apiFetch<MuhurtaResult>(`${API_BASE}/find-muhurta`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Searches for a location using Nominatim (OpenStreetMap).
 * Provides a User-Agent as per their policy.
 */
export async function searchLocation(query: string): Promise<any[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&accept-language=en,hi`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'VanshMala/1.0 (contact@vanshmala.com)',
    },
  });
  if (!res.ok) throw new Error('Location search failed');
  return res.json();
}

/**
 * Gets the IANA timezone name for a given coordinate.
 */
export async function getTimezone(lat: number, lon: number): Promise<{ timeZone: string }> {
  const url = `https://www.timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Timezone fetch failed');
  return res.json();
}

