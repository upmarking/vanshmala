// ============================================================
// Vedic Kundali — TypeScript types for API & DB shapes
// ============================================================

// ---------- API request payloads ----------

export interface KundaliCalculateRequest {
  birth_date: string;   // YYYY-MM-DD
  birth_time: string;   // HH:MM (24h)
  latitude: number;
  longitude: number;
  timezone?: string;    // IANA tz name
  place_name?: string;
  ayanamsa?: string;    // default "lahiri"
}

export interface PanchangRequest {
  latitude: number;
  longitude: number;
  date?: string;        // YYYY-MM-DD, defaults to today
  timezone?: string;
}

export interface MuhurtaRequest {
  purpose: string;
  start_date: string;   // YYYY-MM-DD
  end_date: string;     // YYYY-MM-DD
  latitude: number;
  longitude: number;
  timezone?: string;
  birth_rashi_id?: number;      // 1–12
  birth_nakshatra_id?: number;  // 1–27
  min_score?: number;           // 0–100, default 60
  limit?: number;               // default 30
}

// ---------- API response shapes ----------

export interface AyanamsaOption {
  id: string;
  label: string;
}

export interface MuhurtaPurpose {
  id: string;
  label: string;
}

export interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface TimezoneResponse {
  timeZone: string;
}


export interface PlanetPosition {
  id?: string;
  name: string;
  longitude: number;
  latitude?: number;
  sign: string;
  sign_id: number;
  degree: number;
  minute?: number;
  second?: number;
  nakshatra: string;
  nakshatra_id?: number;
  nakshatra_pada: number;
  house: number;
  retrograde: boolean;
  speed?: number;
  dignity?: string;
  sign_lord?: string;
  nakshatra_lord?: string;
}

export interface HouseData {
  house: number;
  sign: string;
  sign_id: number;
  degree: number;
  planets: string[];
}

export interface VargaChart {
  name: string;
  divisor: number;
  planets: Array<{
    name: string;
    sign: string;
    sign_id: number;
    degree?: number;
  }>;
}

export interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
  duration_years?: number;
  antardasha?: Array<{
    planet: string;
    start: string;
    end: string;
  }>;
}

export interface AshtakavargaPlanet {
  planet: string;
  points: number[];   // 12 sign scores
  total: number;
}

export interface KundaliResult {
  planets: PlanetPosition[];
  houses?: HouseData[];
  ascendant?: {
    sign: string;
    sign_id: number;
    degree: number;
    nakshatra?: string;
  };
  vargas?: VargaChart[];
  dasha?: DashaPeriod[];
  dasha_antar?: DashaPeriod[];
  ashtakavarga?: {
    bhinnashtakavarga: AshtakavargaPlanet[];
    sarvashtakavarga: number[];
  };
  karakas?: Record<string, string>;
  karakamsa?: Record<string, unknown>;
  friendships?: Record<string, unknown>;
  kalsarpa?: Record<string, unknown>;
  yoga?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface PanchangElement {
  name?: string;
  value?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}

export interface PanchangResult {
  tithi?: PanchangElement | Record<string, unknown>;
  nakshatra?: PanchangElement | Record<string, unknown>;
  yoga?: PanchangElement | Record<string, unknown>;
  karana?: PanchangElement | Record<string, unknown>;
  vara?: PanchangElement | string | Record<string, unknown>;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  rahu_kala?: Record<string, unknown>;
  gulika_kala?: Record<string, unknown>;
  yamaganda?: Record<string, unknown>;
  abhijit_muhurta?: Record<string, unknown>;
  muhurtas?: Array<Record<string, unknown>>;
  samvatsara?: Record<string, unknown>;
  masa?: Record<string, unknown>;
  ritu?: Record<string, unknown>;
  calendars?: Record<string, unknown>;
  lagna_transits?: Array<Record<string, unknown>>;
  tarabalam?: Record<string, unknown>;
  chandrabalam?: Record<string, unknown>;
  choghadiya?: Record<string, unknown>;
  gowri_panchang?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface MuhurtaDay {
  date: string;
  score: number;
  label?: string;
  reasons?: string[];
  cautions?: string[];
  tithi?: string;
  nakshatra?: string;
  yoga?: string;
  vara?: string;
  [key: string]: unknown;
}

export interface MuhurtaResult {
  purpose: string;
  results: MuhurtaDay[];
  scanned_days?: number;
  [key: string]: unknown;
}

// ---------- Database row shapes ----------

export interface KundaliInputRow {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  latitude: number;
  longitude: number;
  timezone: string | null;
  place_name: string | null;
  ayanamsa: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface KundaliResultRow {
  id: string;
  input_id: string;
  user_id: string;
  calc_type: 'kundali' | 'panchang' | 'muhurta';
  result_data: KundaliResult | PanchangResult | MuhurtaResult;
  created_at: string;
}
