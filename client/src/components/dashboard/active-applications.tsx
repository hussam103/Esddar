import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Application = {
  id: number;
  tenderId: number;
  status: string;
  submittedAt?: Date;
  tender?: {
    title: string;
    agency: string;
    bidNumber: string;
  };
};

type ActiveApplicationsProps = {
  loading: boolean;
  applications: Application[];
};

export default function ActiveApplications({ loading, applications }: ActiveApplicationsProps) {
  const [, setLocation] = useLocation();

  // Format date for display
  const formatDate = (dateString?: Date | string): string => {
    if (!dateString) return "غير متاح";
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format status for display
  const formatStatus = (status: string): string => {
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
                <tr className="bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">عنوان المناقصة</th>
                  <th className="px-4 py-3">الجهة</th>
                  <th className="px-4 py-3">تاريخ التقديم</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">الإجراء</th>
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
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">الطلبات النشطة</h2>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">عنوان المناقصة</th>
                <th className="px-4 py-3">الجهة</th>
                <th className="px-4 py-3">تاريخ التقديم</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {activeApplications.length > 0 ? (
                activeApplications.map((app) => (
                  <tr key={app.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{app.tender?.title}</div>
                      <div className="text-xs text-gray-500">رقم المناقصة #{app.tender?.bidNumber}</div>
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
                        عرض
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    لا توجد طلبات نشطة
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
