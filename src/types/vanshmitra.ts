// ============================================================
// VanshMitra AI Astrologer — TypeScript types
// ============================================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  language: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export type VanshMitraLanguage =
  | 'en'    // English
  | 'hi'    // Hindi
  | 'ta'    // Tamil
  | 'te'    // Telugu
  | 'bn'    // Bengali
  | 'mr'    // Marathi
  | 'gu'    // Gujarati
  | 'kn'    // Kannada
  | 'ml'    // Malayalam
  | 'pa'    // Punjabi
  | 'or'    // Odia
  | 'as'    // Assamese
  | 'ur'    // Urdu
  | 'ar'    // Arabic
  | 'fa';   // Persian

export interface VanshMitraLanguageOption {
  code: VanshMitraLanguage;
  label: string;
  nativeLabel: string;
}

export const VANSHMITRA_LANGUAGES: VanshMitraLanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'fa', label: 'Persian', nativeLabel: 'فارسی' },
];
