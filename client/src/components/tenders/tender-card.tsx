import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Tender } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Clock, MapPin, Tag } from "lucide-react";

type TenderCardProps = {
  tender: Tender;
  matchScore: number;
  saved?: boolean;
};

export default function TenderCard({ tender, matchScore, saved = false }: TenderCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(saved);

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
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/save-tender", { tenderId: tender.id });
      return await res.json();
    },
    onSuccess: () => {
      setIsSaved(true);
      queryClient.invalidateQueries({ queryKey: [`/api/is-tender-saved/${tender.id}`] });
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

  // Unsave tender mutation
  const unsaveTenderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/save-tender/${tender.id}`);
      return await res.json();
    },
    onSuccess: () => {
      setIsSaved(false);
      queryClient.invalidateQueries({ queryKey: [`/api/is-tender-saved/${tender.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-tenders"] });
      toast({
        title: "Tender removed",
        description: "The tender has been removed from your saved list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove tender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle save/unsave
  const handleSaveTender = () => {
    if (isSaved) {
      unsaveTenderMutation.mutate();
    } else {
      saveTenderMutation.mutate();
    }
  };

  const daysRemaining = getDaysRemaining(tender.deadline);
  const deadlineClass = getDeadlineClass(daysRemaining);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
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
              className={`${isSaved ? 'text-primary-600' : 'text-gray-400'} hover:text-primary-600`}
              onClick={handleSaveTender}
              disabled={saveTenderMutation.isPending || unsaveTenderMutation.isPending}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
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
}
