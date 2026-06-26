'use client';

import { useState, useEffect } from 'react';

// Dictionaries mapping translation keys for language extension
const translations: Record<string, Record<string, string>> = {
  en: {
    welcome: 'Welcome to ChessHub Academy',
    portal_login: 'Portal Login',
    remaining_classes: 'Remaining Classes',
    lichess_rating: 'Lichess Rating',
    streak: 'Daily Streak',
    xp: 'Total XP',
    upcoming_classes: 'Upcoming Sessions',
    homework: 'Assigned Homework',
    solve_puzzle: 'Daily Chess Puzzle',
    reset_board: 'Reset Board',
    analysis_board: 'Analysis Board',
  },
  hi: {
    welcome: 'चेस हब अकादमी में आपका स्वागत है',
    portal_login: 'पोर्टल लॉगिन',
    remaining_classes: 'शेष कक्षाएं',
    lichess_rating: 'लीचेस रेटिंग',
    streak: 'दैनिक स्ट्रीक',
    xp: 'कुल XP',
    upcoming_classes: 'आगामी कक्षाएं',
    homework: 'सौंपा गया गृहकार्य',
    solve_puzzle: 'दैनिक शतरंज पहेली',
    reset_board: 'बोर्ड रीसेट करें',
    analysis_board: 'विश्लेषण बोर्ड',
  }
};

export function useTranslation() {
  const [locale, setLocale] = useState<'en' | 'hi'>('en');

  // Load language from storage/browser settings if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as 'en' | 'hi';
      if (savedLocale && translations[savedLocale]) {
        setLocale(savedLocale);
      }
    }
  }, []);

  const changeLanguage = (newLocale: 'en' | 'hi') => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  };

  return {
    t,
    locale,
    changeLanguage,
    availableLocales: ['en', 'hi'] as const,
  };
}
