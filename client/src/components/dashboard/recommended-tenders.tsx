import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tender } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark, Clock, MapPin, Tag } from "lucide-react";

type RecommendedTendersProps = {
  loading: boolean;
  tenders: Tender[];
};

export default function RecommendedTenders({ loading, tenders }: RecommendedTendersProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
        title: "Tender saved",
        description: "The tender has been added to your saved list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save tender",
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
          <div className="flex items-center space-x-2">
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

  // Calculate match scores (simulated for now)
  const getMatchScore = (index: number): number => {
    return 98 - (index * 2);
  };

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recommended Tenders</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <select className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none">
              <option>All Categories</option>
              <option>IT Services</option>
              <option>Construction</option>
              <option>Consulting</option>
              <option>Healthcare</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="relative">
            <select className="pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none">
              <option>Sort by: Match Score</option>
              <option>Deadline (Earliest)</option>
              <option>Value (Highest)</option>
              <option>Recently Added</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
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
          const matchScore = getMatchScore(index);
          
          return (
            <div key={tender.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
              <div className="relative">
                <div className="absolute top-0 right-0 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-bl-md">
                  {matchScore}% Match
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{tender.title}</h3>
                      <p className="text-sm text-gray-600">{tender.agency}</p>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-primary-600"
                      onClick={() => saveTenderMutation.mutate(tender.id)}
                    >
                      <Bookmark className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <span className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {tender.location}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {tender.category}
                    </span>
                  </div>
                </div>
                <div className="px-4 pb-2">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Value:</span>
                      <span className="text-gray-900">${Number(tender.valueMin).toLocaleString()} - ${Number(tender.valueMax).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className={`flex items-center ${deadlineClass}`}>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Deadline: {daysRemaining} days left</span>
                    </div>
                    <div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-3 flex justify-between">
                  <button 
                    className="text-sm text-primary-600 font-medium hover:text-primary-700"
                    onClick={() => setLocation(`/tenders/${tender.id}`)}
                  >
                    View Details
                  </button>
                  <button 
                    className="px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors duration-150"
                    onClick={() => setLocation(`/tenders/${tender.id}`)}
                  >
                    Apply Now
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
          View All Recommended Tenders
        </Button>
      </div>
    </section>
  );
}
