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
    // Email verification
    "Email Confirmation": "تأكيد البريد الإلكتروني",
    "Verifying your email address...": "جاري التحقق من بريدك الإلكتروني...",
    "Verification complete": "تم التحقق بنجاح",
    "Verification failed": "فشل التحقق",
    "Your email has been confirmed successfully!": "تم تأكيد بريدك الإلكتروني بنجاح!",
    "Invalid or missing confirmation token": "رمز التأكيد غير صالح أو مفقود",
    "Failed to confirm email": "فشل في تأكيد البريد الإلكتروني",
    "An error occurred while confirming your email": "حدث خطأ أثناء تأكيد بريدك الإلكتروني",
    "Email Confirmed": "تم تأكيد البريد الإلكتروني",
    "Your email has been confirmed successfully.": "تم تأكيد بريدك الإلكتروني بنجاح.",
    "Confirmation Failed": "فشل التأكيد",
    "Failed to confirm your email.": "فشل في تأكيد بريدك الإلكتروني.",
    "Error": "خطأ",
    "Proceed to Dashboard": "انتقل إلى لوحة التحكم",
    "Back to Login": "العودة إلى تسجيل الدخول",
    "Resend Confirmation Email": "إعادة إرسال بريد التأكيد",
    "Email Sent": "تم إرسال البريد",
    "A new confirmation email has been sent.": "تم إرسال بريد تأكيد جديد.",
    "Failed to resend confirmation email.": "فشل في إعادة إرسال بريد التأكيد.",
    // Onboarding
    "Welcome to Esddar": "مرحبًا بك في إصدار",
    "Complete these steps to set up your account and start finding relevant tenders.": "أكمل هذه الخطوات لإعداد حسابك والبدء في البحث عن المناقصات المناسبة.",
    "Verify Email": "تأكيد البريد الإلكتروني",
    "Confirm your email address": "تأكيد عنوان بريدك الإلكتروني",
    "Upload Document": "رفع المستند",
    "Company profile": "ملف الشركة",
    "Choose Plan": "اختر الخطة",
    "Select subscription": "اختر الاشتراك",
    "Payment": "الدفع",
    "Complete subscription": "إكمال الاشتراك",
    "Complete": "اكتمال",
    "Start using platform": "ابدأ استخدام المنصة",
    "Please verify your email address to continue. We've sent a confirmation link to your email.": "يرجى التحقق من بريدك الإلكتروني للمتابعة. لقد أرسلنا رابط تأكيد إلى بريدك الإلكتروني.",
    "We've sent a verification email to your registered email address. Please check your inbox and click the confirmation link.": "لقد أرسلنا بريد إلكتروني للتحقق إلى عنوان بريدك الإلكتروني المسجل. يرجى التحقق من صندوق الوارد والنقر على رابط التأكيد.",
    "Please upload your company profile document to help us match you with relevant tenders.": "يرجى تحميل مستند ملف الشركة لمساعدتنا في مطابقتك مع المناقصات ذات الصلة.",
    "Upload your company profile document (PDF format). This will help us identify the best tenders for your business.": "قم بتحميل مستند ملف الشركة (بتنسيق PDF). سيساعدنا هذا في تحديد أفضل المناقصات لعملك.",
    "Document uploaded": "تم تحميل المستند",
    "Status": "الحالة",
    "Continue to Plan Selection": "المتابعة إلى اختيار الخطة",
    "Choose a subscription plan that best fits your business needs.": "اختر خطة اشتراك تناسب احتياجات عملك بشكل أفضل.",
    "Select a subscription plan to access all features of our platform. Choose the option that best suits your business needs.": "اختر خطة اشتراك للوصول إلى جميع ميزات منصتنا. اختر الخيار الذي يناسب احتياجات عملك بشكل أفضل.",
    "Basic": "أساسي",
    "Professional": "احترافي",
    "Enterprise": "مؤسسات",
    "For small businesses": "للشركات الصغيرة",
    "For growing businesses": "للشركات النامية",
    "For large organizations": "للمؤسسات الكبيرة",
    "per month": "شهريًا",
    "Up to 5 tender matches": "ما يصل إلى 5 مطابقات مناقصة",
    "Basic analytics": "تحليلات أساسية",
    "Email notifications": "إشعارات البريد الإلكتروني",
    "Unlimited tender matches": "مطابقات مناقصة غير محدودة",
    "Advanced analytics": "تحليلات متقدمة",
    "Priority notifications": "إشعارات ذات أولوية",
    "Proposal templates": "قوالب المقترحات",
    "All Professional features": "جميع ميزات الباقة الاحترافية",
    "API access": "الوصول إلى واجهة برمجة التطبيقات",
    "Dedicated support": "دعم مخصص",
    "Custom integrations": "تكاملات مخصصة",
    "Select Plan": "اختر الخطة",
    "Skip for Now": "تخطي في الوقت الحالي",
    "Complete your subscription payment to access all features.": "أكمل دفع اشتراكك للوصول إلى جميع الميزات.",
    "Please complete your payment to activate your subscription. You can also skip this step and subscribe later.": "يرجى إكمال الدفع لتفعيل اشتراكك. يمكنك أيضًا تخطي هذه الخطوة والاشتراك لاحقًا.",
    "Complete Payment": "إكمال الدفع",
    "Congratulations! Your account is fully set up.": "تهانينا! تم إعداد حسابك بالكامل.",
    "You have completed the onboarding process. You can now access all features of the platform based on your subscription.": "لقد أكملت عملية التأهيل. يمكنك الآن الوصول إلى جميع ميزات المنصة بناءً على اشتراكك.",
    "Go to Dashboard": "الانتقال إلى لوحة التحكم",
    "POPULAR": "الأكثر شعبية",
    "Document Uploaded": "تم تحميل المستند",
    "Your document has been uploaded successfully.": "تم تحميل المستند بنجاح.",
    "Success": "نجاح",
    "Moved to the next step successfully.": "تم الانتقال إلى الخطوة التالية بنجاح.",
    "Failed to proceed to next step.": "فشل المتابعة إلى الخطوة التالية.",
    "A confirmation email has been sent to your email address.": "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.",
    "An error occurred while sending the confirmation email.": "حدث خطأ أثناء إرسال رسالة التأكيد الإلكترونية.",
    "Failed to fetch onboarding status.": "فشل في جلب حالة التأهيل.",
    "An error occurred while fetching your onboarding status.": "حدث خطأ أثناء جلب حالة التأهيل الخاصة بك.",
    "An error occurred while updating your onboarding progress.": "حدث خطأ أثناء تحديث تقدم التأهيل الخاص بك.",
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
    // Email verification
    "Email Confirmation": "Email Confirmation",
    "Verifying your email address...": "Verifying your email address...",
    "Verification complete": "Verification complete",
    "Verification failed": "Verification failed",
    "Your email has been confirmed successfully!": "Your email has been confirmed successfully!",
    "Invalid or missing confirmation token": "Invalid or missing confirmation token",
    "Failed to confirm email": "Failed to confirm email",
    "An error occurred while confirming your email": "An error occurred while confirming your email",
    "Email Confirmed": "Email Confirmed",
    "Your email has been confirmed successfully.": "Your email has been confirmed successfully.",
    "Confirmation Failed": "Confirmation Failed",
    "Failed to confirm your email.": "Failed to confirm your email.",
    "Error": "Error",
    "Proceed to Dashboard": "Proceed to Dashboard",
    "Back to Login": "Back to Login",
    "Resend Confirmation Email": "Resend Confirmation Email",
    "Email Sent": "Email Sent",
    "A new confirmation email has been sent.": "A new confirmation email has been sent.",
    "Failed to resend confirmation email.": "Failed to resend confirmation email.",
    // Onboarding
    "Welcome to Esddar": "Welcome to Esddar",
    "Complete these steps to set up your account and start finding relevant tenders.": "Complete these steps to set up your account and start finding relevant tenders.",
    "Verify Email": "Verify Email",
    "Confirm your email address": "Confirm your email address",
    "Upload Document": "Upload Document",
    "Company profile": "Company profile",
    "Choose Plan": "Choose Plan",
    "Select subscription": "Select subscription",
    "Payment": "Payment",
    "Complete subscription": "Complete subscription",
    "Complete": "Complete",
    "Start using platform": "Start using platform",
    "Please verify your email address to continue. We've sent a confirmation link to your email.": "Please verify your email address to continue. We've sent a confirmation link to your email.",
    "We've sent a verification email to your registered email address. Please check your inbox and click the confirmation link.": "We've sent a verification email to your registered email address. Please check your inbox and click the confirmation link.",
    "Please upload your company profile document to help us match you with relevant tenders.": "Please upload your company profile document to help us match you with relevant tenders.",
    "Upload your company profile document (PDF format). This will help us identify the best tenders for your business.": "Upload your company profile document (PDF format). This will help us identify the best tenders for your business.",
    "Document uploaded": "Document uploaded",
    "Status": "Status",
    "Continue to Plan Selection": "Continue to Plan Selection",
    "Choose a subscription plan that best fits your business needs.": "Choose a subscription plan that best fits your business needs.",
    "Select a subscription plan to access all features of our platform. Choose the option that best suits your business needs.": "Select a subscription plan to access all features of our platform. Choose the option that best suits your business needs.",
    "Basic": "Basic",
    "Professional": "Professional",
    "Enterprise": "Enterprise",
    "For small businesses": "For small businesses",
    "For growing businesses": "For growing businesses",
    "For large organizations": "For large organizations",
    "per month": "per month",
    "Up to 5 tender matches": "Up to 5 tender matches",
    "Basic analytics": "Basic analytics",
    "Email notifications": "Email notifications",
    "Unlimited tender matches": "Unlimited tender matches",
    "Advanced analytics": "Advanced analytics",
    "Priority notifications": "Priority notifications",
    "Proposal templates": "Proposal templates",
    "All Professional features": "All Professional features",
    "API access": "API access",
    "Dedicated support": "Dedicated support",
    "Custom integrations": "Custom integrations",
    "Select Plan": "Select Plan",
    "Skip for Now": "Skip for Now",
    "Complete your subscription payment to access all features.": "Complete your subscription payment to access all features.",
    "Please complete your payment to activate your subscription. You can also skip this step and subscribe later.": "Please complete your payment to activate your subscription. You can also skip this step and subscribe later.",
    "Complete Payment": "Complete Payment",
    "Congratulations! Your account is fully set up.": "Congratulations! Your account is fully set up.",
    "You have completed the onboarding process. You can now access all features of the platform based on your subscription.": "You have completed the onboarding process. You can now access all features of the platform based on your subscription.",
    "Go to Dashboard": "Go to Dashboard",
    "POPULAR": "POPULAR",
    "Document Uploaded": "Document Uploaded",
    "Your document has been uploaded successfully.": "Your document has been uploaded successfully.",
    "Success": "Success",
    "Moved to the next step successfully.": "Moved to the next step successfully.",
    "Failed to proceed to next step.": "Failed to proceed to next step.",
    "A confirmation email has been sent to your email address.": "A confirmation email has been sent to your email address.",
    "An error occurred while sending the confirmation email.": "An error occurred while sending the confirmation email.",
    "Failed to fetch onboarding status.": "Failed to fetch onboarding status.",
    "An error occurred while fetching your onboarding status.": "An error occurred while fetching your onboarding status.",
    "An error occurred while updating your onboarding progress.": "An error occurred while updating your onboarding progress.",
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

// Add useTranslation hook for simpler access to translation function
export function useTranslation() {
  const { t, language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
}