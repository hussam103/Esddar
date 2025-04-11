import { useState } from "react";
import { useLocation } from "wouter";
import { Tender, Application } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

type UpcomingDeadlinesProps = {
  loading: boolean;
  applications: Application[];
  tenders: Tender[];
};

export default function UpcomingDeadlines({ loading, applications, tenders }: UpcomingDeadlinesProps) {
  const [, setLocation] = useLocation();
  const [currentMonth] = useState(new Date());
  const { language } = useLanguage();

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
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Find tenders with upcoming deadlines
  const getUpcomingDeadlines = (): Tender[] => {
    const now = new Date();
    const oneWeekLater = new Date(now);
    oneWeekLater.setDate(now.getDate() + 7);
    
    // Find tenders with deadlines in the next 7 days
    return tenders
      .filter(tender => {
        const deadlineDate = new Date(tender.deadline);
        return deadlineDate >= now && deadlineDate <= oneWeekLater;
      })
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
      <section className="mt-8 mb-8">
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
    <section className="mt-8 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {language === "ar" ? "المواعيد النهائية القادمة" : "Upcoming Deadlines"}
        </h2>
        <button className="text-sm text-primary-600 font-medium hover:text-primary-700">
          {language === "ar" ? "عرض التقويم" : "View Calendar"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Column: Calendar Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center font-medium text-gray-800 mb-4">{formatMonth(currentMonth)}</div>
          <div className="grid grid-cols-7 gap-1">
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "أحد" : "Sun"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "إثن" : "Mon"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "ثلا" : "Tue"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "أرب" : "Wed"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "خمي" : "Thu"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "جمع" : "Fri"}
            </div>
            <div className="text-center text-xs text-gray-500 py-1">
              {language === "ar" ? "سبت" : "Sat"}
            </div>
            
            {/* Previous month days */}
            {calendar.prevMonthDays.map((day, index) => (
              <div key={`prev-${index}`} className="text-center py-1 text-gray-400 text-sm">{day}</div>
            ))}
            
            {/* Current month days */}
            {calendar.currentMonthDays.map((day) => (
              <div 
                key={`current-${day}`} 
                className={`text-center py-1 text-sm ${
                  calendar.isToday(day) 
                    ? "bg-gray-100 rounded" 
                    : calendar.hasDeadline(day) 
                      ? "bg-red-100 text-red-800 font-medium rounded" 
                      : ""
                }`}
              >
                {day}
              </div>
            ))}
            
            {/* Next month days */}
            {calendar.nextMonthDays.map((day, index) => (
              <div key={`next-${index}`} className="text-center py-1 text-gray-400 text-sm">{day}</div>
            ))}
          </div>
          
          <div className={`mt-4 text-xs flex space-x-4 ${language === "ar" ? "space-x-reverse" : ""}`}>
            <div className={`flex items-center ${language === "ar" ? "" : "flex-row-reverse space-x-1 space-x-reverse"}`}>
              <div className={`w-3 h-3 bg-red-100 rounded ${language === "ar" ? "ml-1" : "mr-1"}`}></div>
              <span>{language === "ar" ? "الموعد النهائي" : "Deadline"}</span>
            </div>
            <div className={`flex items-center ${language === "ar" ? "" : "flex-row-reverse space-x-1 space-x-reverse"}`}>
              <div className={`w-3 h-3 bg-gray-100 rounded ${language === "ar" ? "ml-1" : "mr-1"}`}></div>
              <span>{language === "ar" ? "اليوم" : "Today"}</span>
            </div>
          </div>
        </div>
        
        {/* Right Column: Deadline List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 font-medium">
            {language === "ar" ? "الأيام السبعة القادمة" : "Next Seven Days"}
          </div>
          <div className="divide-y divide-gray-200">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((tender) => {
                const { day, month } = formatDeadlineDate(tender.deadline);
                const daysRemaining = getDaysRemaining(tender.deadline);
                const deadlineClass = getDeadlineClass(daysRemaining);
                
                return (
                  <div key={tender.id} className="p-4 flex items-start">
                    <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-100 text-red-800 rounded ml-3">
                      <span className="text-sm font-medium">{day}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{tender.title}</div>
                      <div className="text-sm text-gray-600">{tender.agency}</div>
                      <div className={`mt-1 text-xs ${deadlineClass}`}>
                        {language === "ar" 
                          ? `متبقي ${daysRemaining} يوم` 
                          : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                        }
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => setLocation(`/tenders/${tender.id}`)}
                    >
                      {language === "ar" ? "مراجعة" : "Review"}
                    </Button>
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
