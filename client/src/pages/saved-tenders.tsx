import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import TenderCard from "@/components/tenders/tender-card";
import { Tender } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { BookmarkX } from "lucide-react";

export default function SavedTendersPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch saved tenders
  const { data: savedTenders = [], isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/saved-tenders"],
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/saved"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Saved Tenders" 
          subtitle="Your bookmarked tender opportunities"
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
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
              {savedTenders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {savedTenders.map((tender) => (
                    <TenderCard 
                      key={tender.id} 
                      tender={tender} 
                      matchScore={Math.floor(85 + Math.random() * 15)} // Demo score
                      saved={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg mt-4 bg-white">
                  <BookmarkX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No saved tenders</h3>
                  <p className="text-gray-500 mt-2">You haven't saved any tenders yet.</p>
                  <p className="text-gray-500">Save tenders to access them quickly later.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
