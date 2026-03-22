import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LanguageState {
  currentLanguage: string;
  setLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    set => ({
      currentLanguage: 'en',
      setLanguage: (language: string) => {
        set({ currentLanguage: language });
        // Update document language
        document.documentElement.lang = language;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
