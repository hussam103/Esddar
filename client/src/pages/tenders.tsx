import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TenderFilter from "@/components/tenders/tender-filter";
import TenderCard from "@/components/tenders/tender-card";
import { Tender } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function TendersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [category, setCategory] = useState<string>("كل الفئات");
  const [sortBy, setSortBy] = useState<string>("نسبة التطابق");
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch tenders
  const { data: tenders = [], isLoading, refetch } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  // Fetch user profile to get matching info
  const { data: userProfile } = useQuery({
    queryKey: ["/api/user-profile"],
    enabled: !!user,
  });

  // Filter tenders by category
  const filteredTenders = category === "كل الفئات"
    ? tenders
    : tenders.filter(tender => tender.category === category);

  // Get match scores for tenders
  const getMatchScore = (tenderId: number) => {
    // Base match score between 70-95
    const baseScore = 70 + Math.floor(Math.random() * 25);
    
    // If we have real user profile data, use that to influence the match score 
    // This is a simple simulation - in a real app this would be calculated by AI
    if (userProfile) {
      // Assign higher scores to lower ID tenders to simulate "better matches"
      // In a real app, this would be based on actual matching algorithms
      return Math.min(100, baseScore - (tenderId % 5));
    }
    
    return baseScore;
  };

  // Sort tenders
  const sortedTenders = [...filteredTenders].sort((a, b) => {
    switch (sortBy) {
      case "الموعد النهائي (الأقرب)":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "القيمة (الأعلى)":
        // If valueMax is not a valid number, use 0
        const aValue = Number(a.valueMax) || 0;
        const bValue = Number(b.valueMax) || 0;
        return bValue - aValue;
      case "أضيف مؤخراً":
        // For this implementation, we'll use ID as a proxy for "recently added"
        // Higher ID means more recently added
        return b.id - a.id;
      default: // "نسبة التطابق"
        // Sort by match score (higher scores first)
        return getMatchScore(b.id) - getMatchScore(a.id);
    }
  });

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(tenders.map(tender => tender.category)));
  const categories = ["كل الفئات", ...uniqueCategories];

  // Notification when tenders are loaded
  useEffect(() => {
    if (tenders.length > 0 && !isLoading) {
      toast({
        title: "تم تحميل المناقصات",
        description: `تم تحميل ${tenders.length} مناقصة بنجاح.`,
        variant: "default",
      });
    }
  }, [tenders.length, isLoading, toast]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/tenders"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="كل المناقصات" 
          subtitle="تصفح جميع المناقصات الحكومية المتاحة"
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <TenderFilter 
            categories={categories}
            selectedCategory={category}
            onCategoryChange={setCategory}
            selectedSort={sortBy}
            onSortChange={setSortBy}
          />
          
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
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">لم يتم العثور على مناقصات</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">حاول تعديل معايير التصفية</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
