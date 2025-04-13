import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import { Tender } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Building, Clock, MapPin, Tag } from "lucide-react";
import { formatSAR } from "@/components/ui/currency";
import { SARIcon } from "@/components/ui/sar-icon";
import { TenderDetailsButton } from "@/components/ui/tender-details-button";

type RecommendedTendersProps = {
  loading: boolean;
  tenders: Tender[];
  className?: string;
};

export default function RecommendedTenders({ loading, tenders, className = '' }: RecommendedTendersProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Function to force-refresh recommendations from API
  const refreshRecommendations = async () => {
    setIsRefreshing(true);
    try {
      // Use the new dedicated endpoint for refreshing recommendations
      const response = await apiRequest("POST", "/api/refresh-recommended-tenders");
      const data = await response.json();
      
      // Invalidate query cache to show updated data
      queryClient.invalidateQueries({ queryKey: ["/api/recommended-tenders"] });
      
      toast({
        title: language === "ar" ? "تم تحديث المناقصات الموصى بها" : "Recommendations Refreshed",
        description: language === "ar" 
          ? "تم تحديث المناقصات الموصى بها بنجاح من خلال البحث الدلالي" 
          : data.message || "Successfully refreshed recommended tenders via semantic search",
      });
    } catch (error: any) {
      toast({
        title: language === "ar" ? "فشل تحديث المناقصات" : "Refresh Failed",
        description: error.message || 'Unknown error during refresh',
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get days remaining until deadline
  const getDaysRemaining = (deadline: Date): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get deadline class based on days remaining
  const getDeadlineClass = (daysRemaining: number): string => {
    if (daysRemaining <= 5) return "text-red-600";
    if (daysRemaining <= 15) return "text-amber-600";
    return "text-gray-600";
  };

  // Save tender mutation
  const saveTenderMutation = useMutation({
    mutationFn: async (tenderId: number) => {
      const res = await apiRequest("POST", "/api/save-tender", { tenderId });
      return await res.json();
    },
    onSuccess: (_data, tenderId) => {
      queryClient.invalidateQueries({ queryKey: [`/api/is-tender-saved/${tenderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-tenders"] });
      toast({
        title: "تم حفظ المناقصة",
        description: "تمت إضافة المناقصة إلى قائمة المحفوظات الخاصة بك",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في حفظ المناقصة",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Determine tenders to display (top 3 for dashboard)
  const displayTenders = tenders.slice(0, 3);

  if (loading) {
    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <div className="flex items-center space-x-2 space-x-reverse">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Get match score from tender data or use a fallback
  const getMatchScore = (tender: Tender): number => {
    // If the tender has a matchScore property, use it
    if (tender.matchScore !== null && tender.matchScore !== undefined) {
      // If matchScore is a string, parse it to a number
      return typeof tender.matchScore === 'string' 
        ? Math.round(parseFloat(tender.matchScore)) 
        : Number(tender.matchScore);
    }
    
    // Check if there's match score in the rawData
    if (tender.rawData) {
      try {
        const rawData = JSON.parse(tender.rawData);
        if (rawData.similarity_percentage) {
          return Math.round(parseFloat(String(rawData.similarity_percentage)));
        }
      } catch (e) {
        console.error('Error parsing tender rawData:', e);
      }
    }
    
    // Default fallback for tenders without match scores
    return 75; // Base relevance score
  };

  return (
    <section className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {language === "ar" ? "المناقصات الموصى بها" : "Recommended Tenders"}
        </h2>
        <div className={`flex items-center ${language === "ar" ? "space-x-2 space-x-reverse" : "space-x-2"}`}>
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm"
            className="text-primary bg-white border-primary/20 hover:bg-primary/5 flex items-center gap-1"
            onClick={refreshRecommendations}
            disabled={isRefreshing}
          >
            <svg className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M8 16H3v5"></path>
            </svg>
            {language === "ar" 
              ? (isRefreshing ? "جاري التحديث..." : "تحديث")
              : (isRefreshing ? "Refreshing..." : "Refresh")}
          </Button>
          
          <div className="relative">
            <select className={`${language === "ar" ? "pr-3 pl-8" : "pl-3 pr-8"} py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none`}>
              {language === "ar" ? (
                <>
                  <option>جميع الفئات</option>
                  <option>خدمات تكنولوجيا المعلومات</option>
                  <option>البناء والإنشاءات</option>
                  <option>الاستشارات</option>
                  <option>الرعاية الصحية</option>
                </>
              ) : (
                <>
                  <option>All Categories</option>
                  <option>IT Services</option>
                  <option>Construction</option>
                  <option>Consulting</option>
                  <option>Healthcare</option>
                </>
              )}
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <select className={`${language === "ar" ? "pr-3 pl-8" : "pl-3 pr-8"} py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none`}>
              {language === "ar" ? (
                <>
                  <option>ترتيب حسب: نسبة التطابق</option>
                  <option>الموعد النهائي (الأقرب)</option>
                  <option>القيمة (الأعلى)</option>
                  <option>المضافة حديثًا</option>
                </>
              ) : (
                <>
                  <option>Sort by: Match Rate</option>
                  <option>Deadline (Closest)</option>
                  <option>Value (Highest)</option>
                  <option>Recently Added</option>
                </>
              )}
            </select>
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayTenders.map((tender, index) => {
          const daysRemaining = getDaysRemaining(tender.deadline);
          const deadlineClass = getDeadlineClass(daysRemaining);
          const matchScore = getMatchScore(tender);
          
          return (
            <div key={tender.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="relative">
                <div className="absolute top-0 left-0 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-br-md shadow">
                  <span className="flex items-center whitespace-nowrap">
                    {language === "ar" ? `تطابق ${matchScore}%` : `Match ${matchScore}%`}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="w-5/6">
                      <h3 className="font-medium text-gray-900 text-md line-clamp-2 h-12" title={tender.title}>
                        {tender.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        <Building className={`h-3 w-3 text-gray-500 ${language === "ar" ? "ml-1" : "mr-1"} flex-shrink-0`} />
                        <p className="text-sm text-gray-600 line-clamp-1" title={tender.agency}>
                          {tender.agency}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-primary-600 flex-shrink-0"
                      onClick={() => saveTenderMutation.mutate(tender.id)}
                    >
                      <Bookmark className="h-5 w-5" />
                    </button>
                  </div>
                  <div className={`mt-3 flex flex-wrap items-center text-xs text-gray-500 gap-2 ${language === "ar" ? "space-x-reverse" : ""}`}>
                    <div className="flex items-center">
                      <MapPin className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"} flex-shrink-0`} />
                      <span>{tender.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Tag className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"} flex-shrink-0`} />
                      <span>{tender.category}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center w-full">
                      <SARIcon className={`h-4 w-4 text-primary ${language === "ar" ? "ml-1" : "mr-1"} flex-shrink-0`} />
                      <span className={`font-medium text-gray-700 ${language === "ar" ? "ml-1" : "mr-1"}`}>
                        {language === "ar" ? "القيمة:" : "Value:"}
                      </span>
                      <span className="text-gray-900 truncate">
                        {formatSAR(Number(tender.valueMin), language)} - {formatSAR(Number(tender.valueMax), language)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center ${deadlineClass}`}>
                      <Clock className={`h-3 w-3 ${language === "ar" ? "ml-1" : "mr-1"} flex-shrink-0`} />
                      <span>
                        {language === "ar" 
                          ? `الموعد النهائي: متبقي ${daysRemaining} يوم`
                          : `Deadline: ${daysRemaining} days remaining`}
                      </span>
                    </div>
                    <div className={`flex ${language === "ar" ? "space-x-2 space-x-reverse" : "space-x-2"} flex-shrink-0`}>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                        {tender.status === 'open' 
                          ? (language === "ar" ? 'مفتوح' : 'Open')
                          : tender.status === 'closed' 
                            ? (language === "ar" ? 'مغلق' : 'Closed')
                            : tender.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-3 flex justify-between items-center space-x-2 rtl:space-x-reverse">
                  <div className="flex-shrink-0">
                    <TenderDetailsButton 
                      tenderId={tender.id}
                    />
                  </div>
                  <button 
                    className="px-3 py-1 bg-gradient-to-l from-primary-600 to-primary-500 text-white text-sm rounded hover:from-primary-700 hover:to-primary-600 transition-colors duration-150 whitespace-nowrap flex-shrink-0"
                    onClick={() => setLocation(`/tenders/${tender.id}`)}
                  >
                    {language === "ar" ? "تقديم طلب" : "Apply"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-center">
        <Button 
          variant="outline"
          onClick={() => setLocation("/tenders")}
        >
          {language === "ar" ? "عرض كل المناقصات الموصى بها" : "View All Recommended Tenders"}
        </Button>
      </div>
    </section>
  );
}
