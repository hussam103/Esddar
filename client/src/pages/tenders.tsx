import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TenderFilter from "@/components/tenders/tender-filter";
import TenderCard from "@/components/tenders/tender-card";
import { Tender } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function TendersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [category, setCategory] = useState<string>("All Categories");
  const [sortBy, setSortBy] = useState<string>("Match Score");

  // Fetch tenders
  const { data: tenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  // Filter tenders by category
  const filteredTenders = category === "All Categories"
    ? tenders
    : tenders.filter(tender => tender.category === category);

  // Sort tenders
  const sortedTenders = [...filteredTenders].sort((a, b) => {
    switch (sortBy) {
      case "Deadline (Earliest)":
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case "Value (Highest)":
        return Number(b.valueMax) - Number(a.valueMax);
      case "Recently Added":
        // For this simple implementation, we'll use ID as a proxy for "recently added"
        return b.id - a.id;
      default: // Match Score - just a random implementation for demo
        return Math.random() - 0.5; // Random for demo purposes
    }
  });

  // Get unique categories for filter
  const uniqueCategories = Array.from(new Set(tenders.map(tender => tender.category)));
  const categories = ["All Categories", ...uniqueCategories];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
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
                <div key={i} className="border rounded-lg p-4">
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
                    matchScore={Math.floor(85 + Math.random() * 15)} // Demo score
                  />
                ))}
              </div>
              
              {sortedTenders.length === 0 && (
                <div className="text-center py-12 border rounded-lg mt-4 bg-white">
                  <h3 className="text-lg font-medium text-gray-700">لم يتم العثور على مناقصات</h3>
                  <p className="text-gray-500 mt-2">حاول تعديل معايير التصفية</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
