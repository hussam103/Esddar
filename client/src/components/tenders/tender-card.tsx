import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Tender } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bookmark, Clock, MapPin, Tag, Building, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
    if (daysRemaining <= 5) return "text-red-600 dark:text-red-400";
    if (daysRemaining <= 15) return "text-amber-600 dark:text-amber-400";
    return "text-gray-600 dark:text-gray-400";
  };

  // Format currency with SAR
  const formatCurrency = (value: string | null | undefined): string => {
    if (!value) return "غير محدد";
    
    const num = Number(value);
    if (isNaN(num)) return "غير محدد";
    if (num === 0) return "غير محدد";
    
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits: 0,
    }).format(num);
  };
  
  // Extract tender ID for Etimad URL
  const getEtimadTenderUrl = (bidNumber: string | null | undefined, tenderId: string | null | undefined): string => {
    if (!bidNumber) return "https://tenders.etimad.sa/Tender/AllTendersForVisitor";
    
    // Using the correct URL format from Etimad website as provided
    // Format: https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=ENCODED_ID
    
    // For demonstration purposes, since we don't have the actual encoded IDs
    // We'll use the AllTendersForVisitor page where users can search by the bid number
    
    // In a production environment, you would need to:
    // 1. Store the encoded STenderId value when scraping from Etimad
    // 2. Use that encoded value in the URL
    return `https://tenders.etimad.sa/Tender/DetailsForVisitor?STenderId=${tenderId || 'Je%20VYYeBPEr%20i%20031Bh5hg=='}`;
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
        title: "تم حفظ المناقصة",
        description: "تمت إضافة المناقصة إلى قائمة المناقصات المحفوظة",
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
        title: "تمت إزالة المناقصة",
        description: "تمت إزالة المناقصة من قائمة المناقصات المحفوظة",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "فشل في إزالة المناقصة",
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
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="relative">
        {/* Match Score Badge */}
        <div className="absolute top-0 right-0 bg-gradient-to-l from-primary-700 to-primary-500 text-white text-xs font-bold px-2 py-1 rounded-bl-md">
          {matchScore}% نسبة تطابق
        </div>
        
        {/* Tender Header */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="w-5/6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-md line-clamp-2" title={tender.title}>
                {tender.title}
              </h3>
              <div className="flex items-center mt-1">
                <Building className="h-3 w-3 text-gray-500 dark:text-gray-400 ml-1" />
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1" title={tender.agency}>
                  {tender.agency}
                </p>
              </div>
            </div>
            <button 
              className={`${isSaved ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'} hover:text-primary-600 dark:hover:text-primary-400`}
              onClick={handleSaveTender}
              disabled={saveTenderMutation.isPending || unsaveTenderMutation.isPending}
              aria-label={isSaved ? "إزالة من المحفوظات" : "حفظ المناقصة"}
            >
              <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {/* Tender Metadata */}
          <div className="mt-3 flex flex-wrap items-center text-xs text-gray-500 dark:text-gray-400 gap-2">
            <div className="flex items-center">
              <Hash className="h-3 w-3 ml-1" />
              <span>رقم المناقصة: {tender.bidNumber}</span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 ml-1" />
              <span>{tender.location}</span>
            </div>
            <div className="flex items-center">
              <Tag className="h-3 w-3 ml-1" />
              <span>{tender.category}</span>
            </div>
          </div>
        </div>
        
        {/* Tender Value */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300 ml-1">القيمة:</span>
              <span className="text-gray-900 dark:text-gray-100">{formatCurrency(tender.valueMin)} - {formatCurrency(tender.valueMax)}</span>
            </div>
          </div>
        </div>
        
        {/* Deadline & Status */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center ${deadlineClass}`}>
              <Clock className="h-3 w-3 ml-1" />
              <span>الموعد النهائي: {daysRemaining} يوم متبقي</span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              {/* Badge for tender source */}
              {!tender.bidNumber?.startsWith('T-20') ? (
                <Badge className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  منصة اعتماد
                </Badge>
              ) : null}
              
              {/* Badge for tender status */}
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800">
                {tender.status === 'open' ? 'مفتوح' : tender.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between">
          <button 
            className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300"
            onClick={() => setLocation(`/tenders/${tender.id}`)}
          >
            عرض التفاصيل
          </button>
          {tender.bidNumber && tender.bidNumber.startsWith('T-20') ? (
            // For generated tenders, redirect to local page
            <button 
              className="px-3 py-1 bg-gradient-to-l from-primary-600 to-primary-500 text-white text-sm rounded hover:from-primary-700 hover:to-primary-600 transition-colors duration-150"
              onClick={() => setLocation(`/tenders/${tender.id}`)}
            >
              تقديم طلب
            </button>
          ) : (
            // For Etimad tenders, open in a new tab
            <a 
              href={getEtimadTenderUrl(tender.bidNumber, tender.etimadId || null)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-gradient-to-l from-primary-600 to-primary-500 text-white text-sm rounded hover:from-primary-700 hover:to-primary-600 transition-colors duration-150 inline-block text-center"
            >
              تقديم طلب في منصة اعتماد
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
