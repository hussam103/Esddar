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
    // Tenders page
    "tenders.title": "كل المناقصات",
    "tenders.subtitle": "تصفح جميع المناقصات الحكومية المتاحة",
    "tenders.allCategories": "كل الفئات",
    "tenders.sortBy": "ترتيب حسب",
    "tenders.matchPercentage": "نسبة التطابق",
    "tenders.deadlineClosest": "الموعد النهائي (الأقرب)",
    "tenders.valueHighest": "القيمة (الأعلى)",
    "tenders.recentlyAdded": "أضيف مؤخراً",
    "tenders.showingCategories": "عرض <count> فئات",
    "tenders.noTendersFound": "لم يتم العثور على مناقصات",
    "tenders.tryChangingFilters": "حاول تعديل معايير التصفية",
    "tenders.loadingSuccess": "تم تحميل المناقصات",
    "tenders.loadingSuccessDesc": "تم تحميل <count> مناقصة بنجاح.",
    // Saved tenders page
    "savedTenders.title": "المناقصات المحفوظة",
    "savedTenders.subtitle": "فرص المناقصات المفضلة لديك",
    "savedTenders.noTenders": "لا توجد مناقصات محفوظة",
    "savedTenders.notSavedYet": "لم تقم بحفظ أي مناقصات حتى الآن.",
    "savedTenders.saveForLater": "احفظ المناقصات للوصول إليها بسرعة لاحقاً.",
    // Tender card
    "tenders.matchScore": "نسبة تطابق",
    "tenders.bidNumber": "رقم المناقصة",
    "tenders.value": "القيمة",
    "tenders.undefined": "غير محدد",
    "tenders.notAvailable": "غير متاح",
    "tenders.deadline": "الموعد النهائي",
    "tenders.daysRemaining": "يوم متبقي",
    "tenders.etimadPlatform": "منصة اعتماد",
    "tenders.statusOpen": "مفتوح",
    "tenders.viewDetails": "عرض التفاصيل",
    "tenders.applyOnEtimad": "تقديم طلب في منصة اعتماد",
    "tenders.apply": "تقديم طلب",
    "tenders.saved": "تم حفظ المناقصة",
    "tenders.savedDesc": "تمت إضافة المناقصة إلى قائمة المناقصات المحفوظة",
    "tenders.saveError": "فشل في حفظ المناقصة",
    "tenders.removed": "تمت إزالة المناقصة",
    "tenders.removedDesc": "تمت إزالة المناقصة من قائمة المناقصات المحفوظة",
    "tenders.removeError": "فشل في إزالة المناقصة",
    "tenders.saveTender": "حفظ المناقصة",
    "tenders.removeFromSaved": "إزالة من المحفوظات",
    // Tender details page
    "tenderDetails.title": "تفاصيل المناقصة",
    "tenderDetails.overview": "نظرة عامة",
    "tenderDetails.location": "الموقع",
    "tenderDetails.timeRemaining": "الوقت المتبقي",
    "tenderDetails.description": "الوصف",
    "tenderDetails.requirements": "المتطلبات",
    "tenderDetails.status": "الحالة",
    "tenderDetails.issuingAgency": "الجهة المصدرة",
    "tenderDetails.governmentInstitution": "المؤسسة الحكومية",
    "tenderDetails.applyForTender": "تقديم طلب لهذه المناقصة",
    "tenderDetails.completeForm": "أكمل النموذج أدناه لتقديم طلبك",
    "tenderDetails.applyNow": "تقديم الآن",
    "tenderDetails.saveTender": "حفظ المناقصة",
    "tenderDetails.tabDetails": "التفاصيل",
    "tenderDetails.tabProposal": "المقترح",
    "tenderDetails.deadline": "الموعد النهائي",
    "tenderDetails.daysLeft": "يوم متبقي",
    "tenderDetails.value": "القيمة",
    "tenderDetails.category": "الفئة",
    "tenderDetails.bidNumber": "رقم المناقصة",
    "tenderDetails.proposalContent": "محتوى المقترح",
    "tenderDetails.proposalPlaceholder": "وصف مقترحك لهذه المناقصة...",
    "tenderDetails.aiSuggestions": "اقتراحات الذكاء الاصطناعي",
    "tenderDetails.aiSuggestion1": "أبرز خبرتك في المشاريع المماثلة",
    "tenderDetails.aiSuggestion2": "تناول المتطلبات المحددة المذكورة في المناقصة",
    "tenderDetails.aiSuggestion3": "أضف نقاط البيع الفريدة التي تتوافق مع هذه الفرصة",
    "tenderDetails.backToTenders": "العودة إلى المناقصات",
    "tenderDetails.applyOnEtimad": "تقديم طلب في منصة اعتماد",
    "tenderDetails.submitApplication": "تقديم الطلب"
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
    // Tenders page
    "tenders.title": "All Tenders",
    "tenders.subtitle": "Browse all available government tenders",
    "tenders.allCategories": "All Categories",
    "tenders.sortBy": "Sort by",
    "tenders.matchPercentage": "Match Percentage",
    "tenders.deadlineClosest": "Deadline (Closest)",
    "tenders.valueHighest": "Value (Highest)",
    "tenders.recentlyAdded": "Recently Added",
    "tenders.showingCategories": "Showing <count> categories",
    "tenders.noTendersFound": "No tenders found",
    "tenders.tryChangingFilters": "Try changing your filter criteria",
    "tenders.loadingSuccess": "Tenders Loaded",
    "tenders.loadingSuccessDesc": "Successfully loaded <count> tenders.",
    // Saved tenders page
    "savedTenders.title": "Saved Tenders",
    "savedTenders.subtitle": "Your favorite tender opportunities",
    "savedTenders.noTenders": "No Saved Tenders",
    "savedTenders.notSavedYet": "You haven't saved any tenders yet.",
    "savedTenders.saveForLater": "Save tenders for quick access later.",
    // Tender card
    "tenders.matchScore": "match score",
    "tenders.bidNumber": "Tender number",
    "tenders.value": "Value",
    "tenders.undefined": "Undefined",
    "tenders.notAvailable": "Not Available",
    "tenders.deadline": "Deadline",
    "tenders.daysRemaining": "days remaining",
    "tenders.etimadPlatform": "Etimad Platform",
    "tenders.statusOpen": "Open",
    "tenders.viewDetails": "View Details",
    "tenders.applyOnEtimad": "Apply on Etimad Platform",
    "tenders.apply": "Apply",
    "tenders.saved": "Tender Saved",
    "tenders.savedDesc": "The tender has been added to your saved tenders list",
    "tenders.saveError": "Failed to save tender",
    "tenders.removed": "Tender Removed",
    "tenders.removedDesc": "The tender has been removed from your saved tenders list",
    "tenders.removeError": "Failed to remove tender",
    "tenders.saveTender": "Save tender",
    "tenders.removeFromSaved": "Remove from saved",
    // Tender details page
    "tenderDetails.title": "Tender Details",
    "tenderDetails.overview": "Overview",
    "tenderDetails.location": "Location",
    "tenderDetails.timeRemaining": "Time Remaining",
    "tenderDetails.description": "Description",
    "tenderDetails.requirements": "Requirements",
    "tenderDetails.status": "Status",
    "tenderDetails.issuingAgency": "Issuing Agency",
    "tenderDetails.governmentInstitution": "Government Institution",
    "tenderDetails.applyNow": "Apply Now",
    "tenderDetails.saveTender": "Save Tender",
    "tenderDetails.applyForTender": "Apply for this Tender",
    "tenderDetails.completeForm": "Complete the form below to submit your application",
    "tenderDetails.tabDetails": "Details",
    "tenderDetails.tabProposal": "Proposal",
    "tenderDetails.deadline": "Deadline",
    "tenderDetails.daysLeft": "days left",
    "tenderDetails.value": "Value",
    "tenderDetails.category": "Category",
    "tenderDetails.bidNumber": "Bid Number",
    "tenderDetails.proposalContent": "Proposal Content",
    "tenderDetails.proposalPlaceholder": "Describe your proposal for this tender...",
    "tenderDetails.aiSuggestions": "AI Suggestions",
    "tenderDetails.aiSuggestion1": "Highlight your experience with similar projects",
    "tenderDetails.aiSuggestion2": "Address specific requirements mentioned in the tender",
    "tenderDetails.aiSuggestion3": "Include your unique selling points that match this opportunity",
    "tenderDetails.backToTenders": "Back to Tenders",
    "tenderDetails.applyOnEtimad": "Apply on Etimad Platform",
    "tenderDetails.submitApplication": "Submit Application"
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