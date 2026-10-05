import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { readLocale, translate, writeLocale, type Locale, type MessageKey } from './messages';

interface LanguageValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    writeLocale(locale);
  }, [locale]);

  const value = useMemo<LanguageValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useI18n must be used within LanguageProvider');
  return value;
}
