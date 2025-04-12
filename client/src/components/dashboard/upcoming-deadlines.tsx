import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Tender, Application } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarClock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type UpcomingDeadlinesProps = {
  loading: boolean;
  applications: Application[];
  tenders: Tender[];
  className?: string;
};

type CalendarType = "gregorian" | "hijri";

export default function UpcomingDeadlines({ loading, applications, tenders, className = '' }: UpcomingDeadlinesProps) {
  const [, setLocation] = useLocation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarType, setCalendarType] = useState<CalendarType>("gregorian");
  const [popupVisible, setPopupVisible] = useState<number | null>(null);
  const { language } = useLanguage();
  const popupRef = useRef<HTMLDivElement>(null);

  // Get the number of days in the current month
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Format month name
  const formatMonth = (date: Date): string => {
    if (calendarType === "hijri" && language === "ar") {
      // Use Arabic localization with Islamic calendar
      return date.toLocaleDateString('ar-SA-islamic', { 
        month: 'long', 
        year: 'numeric',
        calendar: 'islamic' 
      });
    } else {
      // Use standard localization
      return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    }
  };
  
  // Convert date to Hijri
  const getHijriDate = (date: Date): string => {
    try {
      return date.toLocaleDateString('ar-SA-islamic', {
        day: 'numeric',
        calendar: 'islamic'
      });
    } catch (error) {
      return date.getDate().toString();
    }
  };
  
  // Get tenders for a specific day
  const getTendersForDay = (day: number): Tender[] => {
    return tenders.filter(tender => {
      const deadlineDate = new Date(tender.deadline);
      return deadlineDate.getDate() === day && 
             deadlineDate.getMonth() === currentMonth.getMonth() &&
             deadlineDate.getFullYear() === currentMonth.getFullYear();
    });
  };
  
  // Handle month navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };
  
  // Toggle calendar type
  const toggleCalendarType = () => {
    setCalendarType(calendarType === "gregorian" ? "hijri" : "gregorian");
  };

  // Find tenders with upcoming deadlines
  const getUpcomingDeadlines = (): Tender[] => {
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);
    
    // For demonstration purposes, let's duplicate some tenders to show scrolling behavior
    let upcomingTenders = tenders
      .filter(tender => {
        const deadlineDate = new Date(tender.deadline);
        return deadlineDate >= now && deadlineDate <= oneWeekLater;
      });
    
    // If we don't have enough tenders with deadlines, include all tenders
    if (upcomingTenders.length < 3) {
      upcomingTenders = [...tenders];
    }
    
    // Sort by deadline date (ascending)
    return upcomingTenders
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  };

  // Format deadline date
  const formatDeadlineDate = (date: Date): { day: number, month: string } => {
    const deadlineDate = new Date(date);
    return {
      day: deadlineDate.getDate(),
      month: deadlineDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'short' })
    };
  };

  // Calculate days remaining
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
    if (daysRemaining <= 10) return "text-amber-600";
    return "text-gray-600";
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    
    // Days from previous month
    const prevMonthDays = [];
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const daysInPrevMonth = getDaysInMonth(prevMonth);
    
    for (let i = 0; i < firstDay; i++) {
      prevMonthDays.push(daysInPrevMonth - firstDay + i + 1);
    }
    
    // Days from current month
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(i);
    }
    
    // Days from next month
    const nextMonthDays = [];
    const totalCells = 42; // 6 rows x 7 days
    const remainingCells = totalCells - prevMonthDays.length - currentMonthDays.length;
    
    for (let i = 1; i <= remainingCells; i++) {
      nextMonthDays.push(i);
    }
    
    // Find deadline dates
    const deadlineDates = tenders.map(tender => new Date(tender.deadline).getDate());
    
    // Check if a day is today
    const isToday = (day: number) => {
      return day === today.getDate() && 
             currentMonth.getMonth() === today.getMonth() && 
             currentMonth.getFullYear() === today.getFullYear();
    };
    
    // Check if a day has a deadline
    const hasDeadline = (day: number) => {
      return deadlineDates.includes(day);
    };
    
    return {
      prevMonthDays,
      currentMonthDays,
      nextMonthDays,
      isToday,
      hasDeadline
    };
  };

  const calendar = generateCalendarDays();
  const upcomingDeadlines = getUpcomingDeadlines();

  if (loading) {
    return (
      <section className={`mt-8 mb-8 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </section>
    );
  }

  return (
    <section className={`mt-8 mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <CalendarClock className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">
            {language === "ar" ? "المواعيد النهائية القادمة" : "Upcoming Deadlines"}
          </h2>
        </div>
        <button 
          className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center"
          onClick={() => setLocation('/calendar')}
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          {language === "ar" ? "عرض التقويم الكامل" : "View Full Calendar"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Calendar Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 relative">
          {/* Calendar Header with Navigation and Type Toggle */}
          <div className="flex items-center justify-between mb-4">
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex flex-col items-center">
              <h3 className="font-medium text-gray-800">{formatMonth(currentMonth)}</h3>
              <button 
                onClick={toggleCalendarType}
                className="mt-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {language === "ar" 
                  ? (calendarType === "hijri" ? "التقويم الميلادي" : "التقويم الهجري") 
                  : (calendarType === "hijri" ? "Gregorian Calendar" : "Hijri Calendar")
                }
              </button>
            </div>
            
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div key={day} className="text-center text-xs text-gray-500 py-1">
                {language === "ar" 
                  ? ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'][index]
                  : day
                }
              </div>
            ))}
            
            {/* Previous month days */}
            {calendar.prevMonthDays.map((day, index) => (
              <div 
                key={`prev-${index}`} 
                className="text-center py-1 text-gray-400 text-sm"
              >
                {day}
              </div>
            ))}
            
            {/* Current month days */}
            {calendar.currentMonthDays.map((day) => {
              const dayTenders = getTendersForDay(day);
              const hasDeadlines = dayTenders.length > 0;
              
              return (
                <TooltipProvider key={`current-${day}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`text-center py-2 text-sm relative cursor-pointer hover:bg-gray-50 
                          ${calendar.isToday(day) ? "bg-gray-100 rounded" : ""} 
                          ${hasDeadlines ? "bg-red-100 text-red-800 font-medium rounded" : ""}
                        `}
                        onClick={() => hasDeadlines && setPopupVisible(hasDeadlines ? day : null)}
                      >
                        <div className="flex flex-col items-center">
                          <span>{day}</span>
                          {calendarType === "hijri" && (
                            <span className="text-xs text-gray-500 mt-0.5">
                              {getHijriDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                            </span>
                          )}
                        </div>
                        {hasDeadlines && (
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </TooltipTrigger>
                    {hasDeadlines && (
                      <TooltipContent side="right" className="p-0 w-64">
                        <div className="bg-white rounded shadow-lg border border-gray-200 overflow-hidden">
                          <div className="p-2 bg-primary-50 border-b border-gray-200 font-medium text-sm">
                            {language === "ar" 
                              ? `المناقصات ليوم ${day} ${formatMonth(currentMonth)}` 
                              : `Tenders for ${day} ${formatMonth(currentMonth)}`
                            }
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {dayTenders.map(tender => (
                              <div 
                                key={tender.id} 
                                className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                                onClick={() => setLocation(`/tenders/${tender.id}`)}
                              >
                                <div className="font-medium text-sm line-clamp-1">{tender.title}</div>
                                <div className="text-xs text-gray-500">{tender.agency}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
            
            {/* Next month days */}
            {calendar.nextMonthDays.map((day, index) => (
              <div 
                key={`next-${index}`} 
                className="text-center py-1 text-gray-400 text-sm"
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Legend */}
          <div className={`mt-4 text-xs flex items-center justify-between`}>
            <div className={`flex space-x-3 ${language === "ar" ? "space-x-reverse" : ""}`}>
              <div className="flex items-center">
                <div className={`w-3 h-3 bg-red-100 rounded ${language === "ar" ? "ml-1" : "mr-1"}`}></div>
                <span>{language === "ar" ? "الموعد النهائي" : "Deadline"}</span>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 bg-gray-100 rounded ${language === "ar" ? "ml-1" : "mr-1"}`}></div>
                <span>{language === "ar" ? "اليوم" : "Today"}</span>
              </div>
            </div>
            <button
              className="text-primary-600 hover:text-primary-700 text-xs flex items-center"
              onClick={() => setLocation('/calendar')}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {language === "ar" ? "عرض الكل" : "View All"}
            </button>
          </div>
        </div>
        
        {/* Right Column: Deadline List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col h-[500px]">
          <div className="px-4 py-3 border-b border-gray-200 font-medium">
            {language === "ar" ? "الأيام السبعة القادمة" : "Next Seven Days"}
          </div>
          <div className="divide-y divide-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((tender) => {
                const { day, month } = formatDeadlineDate(tender.deadline);
                const daysRemaining = getDaysRemaining(tender.deadline);
                const deadlineClass = getDeadlineClass(daysRemaining);
                
                return (
                  <div key={tender.id} className="p-4 flex items-start hover:bg-gray-50">
                    <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 text-red-800 rounded ${language === "ar" ? "ml-3" : "mr-3"}`}>
                      <span className="text-sm font-medium">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm line-clamp-1" title={tender.title}>
                        {tender.title}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-1" title={tender.agency}>
                        {tender.agency}
                      </div>
                      <div className={`mt-1 text-xs ${deadlineClass}`}>
                        {language === "ar" 
                          ? `متبقي ${daysRemaining} يوم` 
                          : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                        }
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                        onClick={() => setLocation(`/tenders/${tender.id}`)}
                      >
                        {language === "ar" ? "مراجعة" : "Review"}
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-gray-500">
                {language === "ar" 
                  ? "لا توجد مواعيد نهائية في الأيام السبعة القادمة"
                  : "No deadlines in the next seven days"
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
