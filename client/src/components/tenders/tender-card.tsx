import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Tender } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Award as AwardIcon, Bookmark, Clock, MapPin, Tag, Building, Hash } from "lucide-react";
import { SARIcon } from "@/components/ui/sar-icon";
import { Badge } from "@/components/ui/badge";
import { formatSAR } from "@/components/ui/currency";
import { TenderDetailsButton } from "@/components/ui/tender-details-button";

type TenderCardProps = {
  tender: Tender;
  matchScore: number;
  saved?: boolean;
};

export default function TenderCard({ tender, matchScore, saved = false }: TenderCardProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
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
    if (daysRemaining <= 5) return "text-red-600 dark:text-red-400";
    if (daysRemaining <= 15) return "text-amber-600 dark:text-amber-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Format currency with SAR
  const formatCurrency = (value: string | null | undefined): string => {
    const notAvailableText = t("tenders.notAvailable");
    if (!value) return notAvailableText;
    
    const num = Number(value);
    if (isNaN(num)) return notAvailableText;
    if (num === 0) return notAvailableText;
    
    // Use our shared currency formatter
    return formatSAR(num, language);
  };
  
  // Get the URL for external tenders
  const getExternalTenderUrl = (): string => {
    // If tender has a direct URL, use it
    if (tender.url) {
      return tender.url;
    }
    
    // For Etimad tenders with external ID
    if (tender.source === 'etimad' && tender.externalId) {
      return `https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=${encodeURIComponent(tender.externalId)}`;
    }
    
    // Check if we have a bid number that we can use
    if (tender.bidNumber && !tender.bidNumber.startsWith('T-20')) {
      // For externally sourced tenders without external ID, link to Etimad search
      return `https://tenders.etimad.sa/Tender/AllTendersForVisitor?SearchTerm=${encodeURIComponent(tender.bidNumber)}`;
    }
    
    // Fallback to the appropriate source based on where the tender is from
    if (tender.source === 'etimad') {
      return "https://tenders.etimad.sa/Tender/AllTendersForVisitor";
    }
    
    // Default fallback
    return "https://tenders.etimad.sa/Tender/AllTendersForVisitor";
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
        title: t("tenders.savedSuccess"),
        description: t("tenders.savedSuccessDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("tenders.savedError"),
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
        title: t("tenders.unsavedSuccess"),
        description: t("tenders.unsavedSuccessDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("tenders.unsavedError"),
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
  
  // Adjust layout based on current language direction
  const isRTL = language === "ar";
  const directionClass = isRTL ? "space-x-reverse" : "";
  const iconMargin = isRTL ? "ml-1" : "mr-1";

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
      <div className="relative flex-1 flex flex-col">
        {/* Match Score Badge */}
        {matchScore > 0 && (
          <div 
            className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm z-10 flex items-center`}
          >
            <span className="flex items-center gap-1">
              <AwardIcon className="h-3 w-3" />
              {matchScore}% {t("tenders.matchRate")}
            </span>
          </div>
        )}
        
        {/* Tender Header - Fixed height for title */}
        <div className="p-4 pb-2 flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="w-5/6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-md line-clamp-2 h-12" title={tender.title}>
                {tender.title}
              </h3>
              <div className="flex items-center mt-1">
                <Building className={`h-3 w-3 text-gray-500 dark:text-gray-400 ${iconMargin} flex-shrink-0`} />
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1" title={tender.agency}>
                  {tender.agency}
                </p>
              </div>
            </div>
            <button 
              className={`${isSaved ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'} hover:text-primary-600 dark:hover:text-primary-400 flex-shrink-0`}
              onClick={handleSaveTender}
              disabled={saveTenderMutation.isPending || unsaveTenderMutation.isPending}
              aria-label={isSaved ? t("tenders.removeFromSaved") : t("tenders.saveTender")}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Tender Metadata - Fixed height for metadata */}
        <div className={`px-4 flex-shrink-0 h-10`}>
          <div className={`flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2 ${directionClass}`}>
            <div className="flex items-center">
              <Hash className={`h-3 w-3 ${iconMargin} flex-shrink-0`} />
              <span>{t("tenders.bidNumber")}: {tender.bidNumber}</span>
            </div>
            <div className="flex items-center">
              <MapPin className={`h-3 w-3 ${iconMargin} flex-shrink-0`} />
              <span>{tender.location}</span>
            </div>
            <div className="flex items-center">
              <Tag className={`h-3 w-3 ${iconMargin} flex-shrink-0`} />
              <span>{tender.category}</span>
            </div>
          </div>
        </div>
        
        {/* Tender Value - Fixed layout for value section */}
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center text-sm">
            <div className="flex items-center w-full">
              <SARIcon className={`h-4 w-4 text-primary ${iconMargin} flex-shrink-0`} />
              <span className={`font-medium text-gray-700 dark:text-gray-300 ${iconMargin}`}>{t("tenders.value")}:</span>
              <span className="text-gray-900 dark:text-gray-100 truncate">{formatCurrency(tender.valueMin)} - {formatCurrency(tender.valueMax)}</span>
            </div>
          </div>
        </div>
        
        {/* Deadline & Status - Fixed layout */}
        <div className="px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center ${deadlineClass}`}>
              <Clock className={`h-3 w-3 ${iconMargin} flex-shrink-0`} />
              <span>{t("tenders.deadline")}: {daysRemaining} {t("tenders.daysRemaining")}</span>
            </div>
            <div className={`flex ${isRTL ? 'space-x-2 space-x-reverse' : 'space-x-2'} flex-shrink-0`}>
              {/* Badge for tender source */}
              {tender.source === 'etimad' ? (
                <Badge className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  {t("tenders.etimadPlatform")}
                </Badge>
              ) : null}
              
              {/* Badge for tender status */}
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                {tender.status === 'open' ? t("tenders.statusOpen") : tender.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Spacer to push footer to bottom */}
        <div className="flex-grow"></div>
        
        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center mt-auto flex-shrink-0">
          <TenderDetailsButton 
            tenderId={tender.id} 
            className="dark:text-primary-400 dark:hover:text-primary-300" 
          />
          {tender.source === 'etimad' ? (
            // For Etimad tenders, open in a new tab to Etimad website
            <a 
              href={getExternalTenderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gradient-to-l from-primary-600 to-primary-500 text-white text-sm rounded hover:from-primary-700 hover:to-primary-600 transition-colors duration-150 inline-block text-center whitespace-nowrap"
            >
              {t("tenders.applyOnEtimad")}
            </a>
          ) : (
            // For locally generated tenders, redirect to local page
            <button 
              className="px-3 py-1 bg-gradient-to-l from-primary-600 to-primary-500 text-white text-sm rounded hover:from-primary-700 hover:to-primary-600 transition-colors duration-150 whitespace-nowrap"
              onClick={() => setLocation(`/tenders/${tender.id}`)}
            >
              {t("tenders.apply")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
