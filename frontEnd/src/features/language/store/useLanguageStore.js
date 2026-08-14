import { create } from 'zustand';
import { translations } from '../../../locales/translations';

const getInitialLanguage = () => {
  const saved = localStorage.getItem('appLanguage');
  if (saved === 'ar' || saved === 'en') {
    return saved;
  }
  return 'en';
};

const applyLanguageToDOM = (lang) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr';
    if (lang === 'ar') {
      document.documentElement.classList.add('font-arabic');
    } else {
      document.documentElement.classList.remove('font-arabic');
    }
  }
};

const initialLang = getInitialLanguage();
applyLanguageToDOM(initialLang);

export const useLanguageStore = create((set, get) => ({
  lang: initialLang,

  setLanguage: (newLang) => {
    if (newLang !== 'en' && newLang !== 'ar') return;
    localStorage.setItem('appLanguage', newLang);
    applyLanguageToDOM(newLang);
    set({ lang: newLang });
  },

  toggleLanguage: () => {
    const current = get().lang;
    const next = current === 'en' ? 'ar' : 'en';
    localStorage.setItem('appLanguage', next);
    applyLanguageToDOM(next);
    set({ lang: next });
  },

  t: (key, fallback = '') => {
    const currentLang = get().lang;
    const dict = translations[currentLang] || translations.en;
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  }
}));
