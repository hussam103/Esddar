import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

type CustomApplication = {
  id: number;
  tenderId: number;
  status: string;
  submittedAt: Date | null;
  userId: number;
  proposalContent: string | null;
  documents: unknown;
  matchScore: number | null;
  tender?: {
    title: string;
    agency: string;
    bidNumber: string;
  };
};

type ActiveApplicationsProps = {
  loading: boolean;
  applications: CustomApplication[];
  className?: string;
};

export default function ActiveApplications({ loading, applications, className = '' }: ActiveApplicationsProps) {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();

  // Format date for display
  const formatDate = (dateString?: Date | string): string => {
    if (!dateString) return language === "ar" ? "غير متاح" : "Not available";
    
    return new Date(dateString).toLocaleDateString(language === "ar" ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format status for display
  const formatStatus = (status: string): string => {
    if (language === "ar") {
      switch (status) {
        case "submitted":
          return "تم التقديم";
        case "under_review":
          return "قيد المراجعة";
        case "shortlisted":
          return "مؤهل للقائمة المختصرة";
        case "declined":
          return "مرفوض";
        default:
          return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }
    } else {
      switch (status) {
        case "submitted":
          return "Submitted";
        case "under_review":
          return "Under Review";
        case "shortlisted":
          return "Shortlisted";
        case "declined":
          return "Declined";
        default:
          return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
      }
    }
  };

  // Get status badge variant
  const getStatusVariant = (status: string): string => {
    switch (status) {
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "shortlisted":
        return "bg-green-100 text-green-800";
      case "declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <section className="mt-8">
        <Skeleton className="h-6 w-48 mb-4" />
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`bg-gray-50 ${language === "ar" ? "text-right" : "text-left"} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  <th className="px-4 py-3">
                    {language === "ar" ? "عنوان المناقصة" : "Tender Title"}
                  </th>
                  <th className="px-4 py-3">
                    {language === "ar" ? "الجهة" : "Agency"}
                  </th>
                  <th className="px-4 py-3">
                    {language === "ar" ? "تاريخ التقديم" : "Submission Date"}
                  </th>
                  <th className="px-4 py-3">
                    {language === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-4 py-3">
                    {language === "ar" ? "الإجراء" : "Action"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-t border-gray-200">
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-16" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  // Filter to show only the active applications
  const activeApplications = applications.filter(app => 
    app.status === "submitted" || app.status === "under_review" || app.status === "shortlisted"
  );

  return (
    <section className={`mt-8 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {language === "ar" ? "الطلبات النشطة" : "Active Applications"}
      </h2>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className={`bg-gray-50 ${language === "ar" ? "text-right" : "text-left"} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                <th className="px-4 py-3">
                  {language === "ar" ? "عنوان المناقصة" : "Tender Title"}
                </th>
                <th className="px-4 py-3">
                  {language === "ar" ? "الجهة" : "Agency"}
                </th>
                <th className="px-4 py-3">
                  {language === "ar" ? "تاريخ التقديم" : "Submission Date"}
                </th>
                <th className="px-4 py-3">
                  {language === "ar" ? "الحالة" : "Status"}
                </th>
                <th className="px-4 py-3">
                  {language === "ar" ? "الإجراء" : "Action"}
                </th>
              </tr>
            </thead>
            <tbody>
              {activeApplications.length > 0 ? (
                activeApplications.map((app) => (
                  <tr key={app.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{app.tender?.title}</div>
                      <div className="text-xs text-gray-500">
                        {language === "ar" 
                          ? `رقم المناقصة #${app.tender?.bidNumber}`
                          : `Tender # ${app.tender?.bidNumber}`
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {app.tender?.agency}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(app.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 ${getStatusVariant(app.status)} text-xs rounded-full`}>
                        {formatStatus(app.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button 
                        variant="link" 
                        className="text-primary-600 hover:text-primary-700 font-medium p-0 h-auto"
                        onClick={() => setLocation(`/applications/${app.id}`)}
                      >
                        {language === "ar" ? "عرض" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    {language === "ar" ? "لا توجد طلبات نشطة" : "No active applications"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
