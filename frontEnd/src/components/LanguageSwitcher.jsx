import { useLanguageStore } from '../features/language/store/useLanguageStore';

export default function LanguageSwitcher({ compact = false, className = '' }) {
  const { lang, toggleLanguage } = useLanguageStore();

  return (
    <button
      onClick={toggleLanguage}
      type="button"
      title={lang === 'en' ? 'تغيير اللغة إلى العربية' : 'Switch language to English'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-secondary/50 bg-surface-container-high/60 backdrop-blur-md text-on-surface hover:text-secondary text-xs font-semibold transition-all duration-300 cursor-pointer shadow-sm active:scale-95 group select-none ${className}`}
    >
      <span className="material-symbols-outlined text-[16px] text-secondary group-hover:rotate-45 transition-transform duration-500">
        language
      </span>
      {compact ? (
        <span className="font-bold font-mono uppercase tracking-wider text-[11px]">
          {lang === 'en' ? 'AR' : 'EN'}
        </span>
      ) : (
        <span className="font-medium text-xs">
          {lang === 'en' ? 'العربية' : 'English'}
        </span>
      )}
    </button>
  );
}
