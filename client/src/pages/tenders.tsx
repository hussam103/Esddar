import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TenderFilter from "@/components/tenders/tender-filter";
import TenderCard from "@/components/tenders/tender-card";
import { Tender } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TendersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const allCategoriesText = t("tenders.allCategories");
  const matchPercentageText = t("tenders.matchPercentage");
  const [category, setCategory] = useState<string>(allCategoriesText);
  const [sortBy, setSortBy] = useState<string>(matchPercentageText);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tenders
  const { data: tenders = [], isLoading, refetch } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });
  
  // Refresh recommendations mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/refresh-recommended-tenders");
      return await response.json();
    },
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: (data) => {
      // Invalidate tender queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommended-tenders"] });
      
      toast({
        title: language === "ar" ? "تم تحديث المناقصات" : "Tenders Refreshed",
        description: language === "ar"
          ? "تم تحديث قائمة المناقصات الموصى بها بنجاح"
          : data.message || "Successfully refreshed recommended tenders",
      });
    },
    onError: (error: any) => {
      toast({
        title: language === "ar" ? "فشل تحديث المناقصات" : "Refresh Failed",
        description: error.message || "An error occurred while refreshing tenders",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    }
  });

  // Fetch user profile to get matching info
  const { data: userProfile } = useQuery({
    queryKey: ["/api/user-profile"],
    enabled: !!user,
  });

  // Filter tenders by category
  const filteredTenders = category === allCategoriesText
    ? tenders
    : tenders.filter(tender => tender.category === category);

  // Get match scores for tenders using actual similarity percentages from the API
  const getMatchScore = (tender: Tender): number => {
    // First check if the tender has a matchScore property
    if (tender.matchScore !== undefined && tender.matchScore !== null) {
      return Math.round(parseFloat(tender.matchScore));
    }
    
    // If not, try to extract from rawData
    if (tender.rawData) {
      try {
        const rawData = JSON.parse(tender.rawData);
        if (rawData.similarity_percentage) {
          return Math.round(parseFloat(rawData.similarity_percentage));
        }
      } catch (e) {
        console.error('Error parsing tender rawData:', e);
      }
    }
    
    // Default fallback for tenders without match scores
    return 70; // Base relevance score
  };

  // Define sort options based on current language
  const deadlineClosestText = t("tenders.deadlineClosest");
  const valueHighestText = t("tenders.valueHighest");
  const recentlyAddedText = t("tenders.recentlyAdded");

  // Sort tenders
  const sortedTenders = [...filteredTenders].sort((a, b) => {
    switch (sortBy) {
      case deadlineClosestText:
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case valueHighestText:
        // If valueMax is not a valid number, use 0
        const aValue = Number(a.valueMax) || 0;
        const bValue = Number(b.valueMax) || 0;
        return bValue - aValue;
      case recentlyAddedText:
        // For this implementation, we'll use ID as a proxy for "recently added"
        // Higher ID means more recently added
        return b.id - a.id;
      default: // Match percentage is the default
        // Sort by match score (higher scores first)
        return getMatchScore(b) - getMatchScore(a);
    }
  });

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(tenders.map(tender => tender.category)));
  const categories = [allCategoriesText, ...uniqueCategories];

  // Notification when tenders are loaded
  useEffect(() => {
    if (tenders.length > 0 && !isLoading) {
      toast({
        title: t("tenders.loadingSuccess"),
        description: t("tenders.loadingSuccessDesc").replace("<count>", tenders.length.toString()),
        variant: "default",
      });
    }
  }, [tenders.length, isLoading, toast, t]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/tenders"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={t("tenders.title")} 
          subtitle={t("tenders.subtitle")}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex-grow">
              <TenderFilter 
                categories={categories}
                selectedCategory={category}
                onCategoryChange={setCategory}
                selectedSort={sortBy}
                onSortChange={setSortBy}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                variant="outline"
                size="sm" 
                className="text-primary hover:bg-primary/5 border-primary/20 flex items-center gap-1"
                onClick={() => refreshMutation.mutate()}
                disabled={isRefreshing || !user}
              >
                <svg className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M8 16H3v5"></path>
                </svg>
                {language === "ar" 
                  ? (isRefreshing ? "جاري التحديث..." : "تحديث المناقصات")
                  : (isRefreshing ? "Refreshing..." : "Refresh Tenders")}
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-lg p-4 bg-white dark:bg-gray-800">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {sortedTenders.map((tender) => (
                  <TenderCard 
                    key={tender.id} 
                    tender={tender} 
                    matchScore={getMatchScore(tender.id)}
                  />
                ))}
              </div>
              
              {sortedTenders.length === 0 && (
                <div className="text-center py-12 border rounded-lg mt-4 bg-white dark:bg-gray-800">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">{t("tenders.noTendersFound")}</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">{t("tenders.tryChangingFilters")}</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
