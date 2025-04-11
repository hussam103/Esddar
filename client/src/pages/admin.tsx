import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      total: number;
      saved: number;
      skipped: number;
    };
  } | null>(null);
  const [pageNumber, setPageNumber] = useState("1");
  const [pageSize, setPageSize] = useState("50");

  // Check if user is admin (you may want to add an isAdmin field to your user model)
  // For now, we'll just check if the user is the original admin user
  const isAdmin = user?.id === 1;

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات للوصول إلى لوحة الإدارة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleScrape = async () => {
    try {
      setIsLoading(true);
      setResult(null);

      const response = await apiRequest("POST", "/api/scrape-tenders", {
        pageNumber: parseInt(pageNumber),
        pageSize: parseInt(pageSize),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "تم جلب المناقصات بنجاح",
          description: `تم جلب ${data.stats.total} مناقصة، وحفظ ${data.stats.saved} مناقصة جديدة.`,
          variant: "default",
        });
      } else {
        toast({
          title: "فشل في جلب المناقصات",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error scraping tenders:", error);
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "حدث خطأ غير معروف",
      });
      toast({
        title: "فشل في جلب المناقصات",
        description: "حدث خطأ أثناء محاولة جلب المناقصات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">لوحة الإدارة</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>جلب المناقصات</CardTitle>
            <CardDescription>
              استخدم هذه الأداة لجلب المناقصات الحكومية من منصة اعتماد
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pageNumber">رقم الصفحة</Label>
                  <Input
                    id="pageNumber"
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pageSize">عدد المناقصات لكل صفحة</Label>
                  <Input
                    id="pageSize"
                    type="number"
                    min="10"
                    max="100"
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={handleScrape}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري جلب المناقصات...
                  </>
                ) : (
                  "جلب المناقصات"
                )}
              </Button>

              {result && (
                <div className={`mt-4 p-4 rounded-md ${result.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                  <p className="font-medium">{result.message}</p>
                  {result.stats && (
                    <div className="mt-2 text-sm">
                      <p>إجمالي المناقصات: {result.stats.total}</p>
                      <p>المناقصات المحفوظة: {result.stats.saved}</p>
                      <p>المناقصات المتخطاة: {result.stats.skipped}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>إحصائيات النظام</CardTitle>
            <CardDescription>
              معلومات عامة عن النظام والمناقصات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>سيتم إضافة المزيد من الإحصائيات قريباً</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}