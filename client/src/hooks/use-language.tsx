import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Define translations
const translations = {
  ar: {
    "app.name": "إصدار",
    "nav.dashboard": "لوحة التحكم",
    "nav.tenders": "المناقصات",
    "nav.saved": "المحفوظة",
    "nav.applications": "المقترحات",
    "nav.settings": "الإعدادات",
    "nav.admin": "لوحة الإدارة",
    "auth.login": "تسجيل الدخول",
    "auth.logout": "تسجيل الخروج",
    "auth.register": "تسجيل جديد",
    "auth.companyName": "الشركة",
    "settings.profile": "لم يتم تحديد الصناعة",
    "settings.language.ar": "العربية",
    "settings.language.en": "الإنجليزية",
    "dashboard.activeTenders": "المناقصات النشطة",
    "dashboard.savedTenders": "المناقصات المحفوظة",
    "dashboard.submittedProposals": "المقترحات المقدمة",
    "admin.title": "لوحة الإدارة",
    "admin.advancedDashboard": "لوحة تحكم متقدمة",
    "admin.scrapeTenders": "جلب المناقصات",
  },
  en: {
    "app.name": "Esddar",
    "nav.dashboard": "Dashboard",
    "nav.tenders": "Tenders",
    "nav.saved": "Saved",
    "nav.applications": "Proposals",
    "nav.settings": "Settings",
    "nav.admin": "Admin Panel",
    "auth.login": "Login",
    "auth.logout": "Logout",
    "auth.register": "Register",
    "auth.companyName": "Company",
    "settings.profile": "Industry not specified",
    "settings.language.ar": "Arabic",
    "settings.language.en": "English",
    "dashboard.activeTenders": "Active Tenders",
    "dashboard.savedTenders": "Saved Tenders",
    "dashboard.submittedProposals": "Submitted Proposals",
    "admin.title": "Admin Panel",
    "admin.advancedDashboard": "Advanced Dashboard",
    "admin.scrapeTenders": "Scrape Tenders",
  }
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage first
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage && (savedLanguage === "ar" || savedLanguage === "en") 
      ? savedLanguage 
      : "ar"; // Default to Arabic
  });

  useEffect(() => {
    // Apply RTL/LTR direction to document
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    // Save to localStorage
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string): string => {
    const currentTranslations = translations[language];
    return currentTranslations[key as keyof typeof currentTranslations] || key;
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