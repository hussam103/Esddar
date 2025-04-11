import { createContext, ReactNode, useContext, useEffect, useState } from "react";

type Language = "ar" | "en";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Default translations object
const translations = {
  // Common
  "app.name": {
    ar: "اصدار",
    en: "Esddar",
  },
  "app.tagline": {
    ar: "منصة ذكية لمطابقة المناقصات الحكومية",
    en: "Smart Government Tender Matching Platform",
  },
  
  // Auth
  "auth.login": {
    ar: "تسجيل الدخول",
    en: "Login",
  },
  "auth.register": {
    ar: "إنشاء حساب",
    en: "Register",
  },
  "auth.logout": {
    ar: "تسجيل الخروج",
    en: "Logout",
  },
  "auth.username": {
    ar: "اسم المستخدم",
    en: "Username",
  },
  "auth.password": {
    ar: "كلمة المرور",
    en: "Password",
  },
  "auth.email": {
    ar: "البريد الإلكتروني",
    en: "Email",
  },
  "auth.companyName": {
    ar: "اسم الشركة",
    en: "Company Name",
  },
  
  // Dashboard
  "dashboard.title": {
    ar: "لوحة التحكم",
    en: "Dashboard",
  },
  "dashboard.welcome": {
    ar: "مرحبًا بك في لوحة التحكم",
    en: "Welcome to your Dashboard",
  },
  "dashboard.activeTenders": {
    ar: "المناقصات النشطة",
    en: "Active Tenders",
  },
  "dashboard.savedTenders": {
    ar: "المناقصات المحفوظة",
    en: "Saved Tenders",
  },
  "dashboard.applications": {
    ar: "الطلبات المقدمة",
    en: "Your Applications",
  },
  
  // Navigation
  "nav.home": {
    ar: "الرئيسية",
    en: "Home",
  },
  "nav.dashboard": {
    ar: "لوحة التحكم",
    en: "Dashboard",
  },
  "nav.tenders": {
    ar: "المناقصات",
    en: "Tenders",
  },
  "nav.saved": {
    ar: "المناقصات المحفوظة",
    en: "Saved Tenders",
  },
  "nav.applications": {
    ar: "الطلبات المقدمة",
    en: "Applications",
  },
  "nav.settings": {
    ar: "الإعدادات",
    en: "Settings",
  },
  "nav.admin": {
    ar: "لوحة الإدارة",
    en: "Admin Panel",
  },
  
  // Settings
  "settings.title": {
    ar: "الإعدادات",
    en: "Settings",
  },
  "settings.profile": {
    ar: "الملف الشخصي",
    en: "Profile",
  },
  "settings.language": {
    ar: "اللغة",
    en: "Language",
  },
  "settings.save": {
    ar: "حفظ التغييرات",
    en: "Save Changes",
  },
  "settings.language.ar": {
    ar: "العربية",
    en: "Arabic",
  },
  "settings.language.en": {
    ar: "الإنجليزية",
    en: "English",
  },
  
  // Admin
  "admin.title": {
    ar: "لوحة الإدارة",
    en: "Admin Panel",
  },
  "admin.scrape": {
    ar: "جلب المناقصات",
    en: "Scrape Tenders",
  },
  "admin.advanced": {
    ar: "لوحة تحكم متقدمة",
    en: "Advanced Dashboard",
  },
  "admin.source": {
    ar: "مصادر المناقصات",
    en: "Tender Sources",
  },
  "admin.rag": {
    ar: "نظام التوصيات (RAG)",
    en: "Recommendation System (RAG)",
  },
  "admin.statistics": {
    ar: "الإحصائيات والتحليلات",
    en: "Statistics and Analytics",
  },
  "admin.settings": {
    ar: "إعدادات النظام",
    en: "System Settings",
  },
};

export const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Get language preference from localStorage or use Arabic as default
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language") as Language;
    return savedLanguage || "ar";
  });

  // Set the language in localStorage when it changes
  useEffect(() => {
    localStorage.setItem("language", language);
    
    // Set document direction
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    
    // Add appropriate class to document
    if (language === "ar") {
      document.documentElement.classList.add("rtl");
      document.documentElement.classList.remove("ltr");
    } else {
      document.documentElement.classList.add("ltr");
      document.documentElement.classList.remove("rtl");
    }
  }, [language]);

  // Function to update language
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Translation function
  const t = (key: string): string => {
    // @ts-ignore - We know our translations type is correct
    return translations[key]?.[language] || key;
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