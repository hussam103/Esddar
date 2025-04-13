import { UserProfile } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";

type MatchingScoreProps = {
  loading: boolean;
  userProfile?: UserProfile;
  profileCompleteness: number;
};

export default function MatchingScore({ loading, userProfile, profileCompleteness }: MatchingScoreProps) {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Profile completion UI removed from loading state */}
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="mb-4 md:mb-0">
          <h2 className="text-lg font-semibold text-gray-900">
            {language === "ar" ? "مؤشر المطابقة الذكي" : "Smart Matching Score"}
          </h2>
          <p className="text-sm text-gray-500">
            {language === "ar" 
              ? "بناءً على ملف شركتك والنشاط السابق" 
              : "Based on your company profile and previous activity"}
          </p>
        </div>
        {/* Profile completion UI removed */}
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-600">
            {language === "ar" ? "دقة المطابقة" : "Matching Accuracy"}
          </div>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{userProfile?.matchAccuracy || 0}%</span>
            <span className={`${language === "ar" ? "mr-1" : "ml-1"} text-xs text-green-600 flex items-center`}>
              <ArrowUp className="h-3 w-3" />
              5%
            </span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-600">
            {language === "ar" ? "المناقصات المكتشفة" : "Tenders Discovered"}
          </div>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{userProfile?.tendersFound || 0}</span>
            <span className={`${language === "ar" ? "mr-1" : "ml-1"} text-xs text-gray-500`}>
              {language === "ar" ? "هذا الأسبوع" : "This week"}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-600">
            {language === "ar" ? "العروض المقدمة" : "Proposals Submitted"}
          </div>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{userProfile?.proposalsSubmitted || 0}</span>
            <span className={`${language === "ar" ? "mr-1" : "ml-1"} text-xs text-gray-500`}>
              {language === "ar" ? "هذا الشهر" : "This month"}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="text-sm text-gray-600">
            {language === "ar" ? "معدل النجاح" : "Success Rate"}
          </div>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900">{userProfile?.successRate || 0}%</span>
            <span className={`${language === "ar" ? "mr-1" : "ml-1"} text-xs text-green-600 flex items-center`}>
              <ArrowUp className="h-3 w-3" />
              8%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
