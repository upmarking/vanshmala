import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage first for immediate results
    const saved = localStorage.getItem('language');
    return (saved === 'en' || saved === 'hi') ? saved : 'en';
  });

  // Sync language with profile when it loads
  useEffect(() => {
    if (profile?.language) {
      const profileLang = profile.language as Language;
      setLanguageState(profileLang);
      localStorage.setItem('language', profileLang);
    }
  }, [profile?.language]);

  const setLanguage = async (lang: Language) => {
    // Update local state and localStorage first for responsiveness
    setLanguageState(lang);
    localStorage.setItem('language', lang);

    // If user is logged in, update Supabase
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating language:', error);
          toast.error('Failed to save language preference');
        } else {
          // Refresh profile to keep data in sync
          await refreshProfile();
        }
      } catch (err) {
        console.error('Failed to update language in Supabase:', err);
      }
    }
  };

  const t = (en: string, hi: string) => (language === 'en' ? en : hi);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

