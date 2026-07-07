import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import enTranslations from "./en.json";
import ruTranslations from "./ru.json";
import uzTranslations from "./uz.json";
import kaaTranslations from "./kaa.json";

export type Language = "en" | "ru" | "uz" | "kaa";

const translations: Record<Language, any> = {
  en: enTranslations,
  ru: ruTranslations,
  uz: uzTranslations,
  kaa: kaaTranslations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("smart_murojaat_lang");
    if (saved === "en" || saved === "ru" || saved === "uz" || saved === "kaa") {
      return saved as Language;
    }
    return "uz"; // Default language is Uzbek
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("smart_murojaat_lang", lang);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let current: any = translations[language];

    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English if key is missing in active language
        let engFallback: any = translations["en"];
        for (const ek of keys) {
          if (engFallback && typeof engFallback === "object" && ek in engFallback) {
            engFallback = engFallback[ek];
          } else {
            engFallback = null;
            break;
          }
        }
        return engFallback || key;
      }
    }

    return typeof current === "string" ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
