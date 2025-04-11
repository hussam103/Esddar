import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AlertTriangle, AlertCircle, ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
    tips?: string[];
    stats?: {
      total: number;
      saved: number;
      skipped: number;
    };
  } | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    details?: any;
    error?: string;
    status?: number;
  } | null>(null);
  const [pageNumber, setPageNumber] = useState("1");
  const [pageSize, setPageSize] = useState("50");
  const [tenderId, setTenderId] = useState("");

  // Check if user is admin (you may want to add an isAdmin field to your user model)
  // For now, we'll just check if the user is the original admin user
  const isAdmin = user?.id === 1;

  const [_, setLocation] = useLocation();
  
  if (!user) {
    // Use setLocation for navigation instead of Redirect component
    setLocation("/auth");
    return null;
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
                  {!result.success && (
                    <div className="mt-2">
                      {result.details && (
                        <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <AlertTitle className="mr-2 text-yellow-800 dark:text-yellow-300">تفاصيل إضافية</AlertTitle>
                          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                            {result.details}
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        ملاحظة: منصة اعتماد قد تفرض قيودًا على الوصول إلى بياناتها أو تغير واجهة برمجة التطبيقات الخاصة بها.
                      </p>
                      
                      <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium">يمكنك تجربة ما يلي:</p>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {result.tips && result.tips.length > 0 ? 
                            result.tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            )) : (
                            <>
                              <li>تقليل عدد المناقصات في كل صفحة</li>
                              <li>تجربة أرقام صفحات مختلفة (1-5)</li>
                              <li>المحاولة لاحقًا عندما يكون الضغط أقل على منصة اعتماد</li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle>اختبار تكامل منصة اعتماد</CardTitle>
            <CardDescription>
              اختبر تكامل منصة اعتماد وروابط المناقصات
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="rounded-md border p-4">
                <h3 className="text-md font-medium mb-2">مناقصات اعتماد في النظام</h3>
                
                <div className="text-sm space-y-1">
                  <p>هذه المناقصات مصدرها منصة اعتماد وتم تخزينها في قاعدة البيانات الخاصة بنا.</p>
                  <p>يمكنك اختبار زر "تقديم طلب في منصة اعتماد" من خلال الضغط على الروابط أدناه:</p>
                </div>
                
                <div className="mt-4 space-y-3">
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">مناقصة #9: بناء مراكز خدمات حكومية</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      معرف اعتماد: 12345
                    </p>
                    <div className="mt-2 flex space-x-2 space-x-reverse">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation('/tenders/9')}
                      >
                        عرض المناقصة
                      </Button>
                      
                      <a 
                        href="https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=12345"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center"
                      >
                        عرض في اعتماد <ExternalLink className="h-3 w-3 mr-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <h4 className="font-medium">مناقصة #10: بناء مراكز خدمات حكومية</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      معرف اعتماد: 67890
                    </p>
                    <div className="mt-2 flex space-x-2 space-x-reverse">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation('/tenders/10')}
                      >
                        عرض المناقصة
                      </Button>
                      
                      <a 
                        href="https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=67890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-sm rounded bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center"
                      >
                        عرض في اعتماد <ExternalLink className="h-3 w-3 mr-1" />
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  <p>ملاحظة: معرفات اعتماد المستخدمة هنا هي للاختبار فقط. يمكنك تحديث هذه المعرفات بأرقام حقيقية من منصة اعتماد.</p>
                </div>
              </div>
              
              <div className="rounded-md border p-4">
                <h3 className="text-md font-medium mb-2">اختبار معرف مناقصة محدد في منصة اعتماد</h3>
                
                <div className="text-sm space-y-1 mb-4">
                  <p>استخدم هذا القسم لاختبار معرفات المناقصات مباشرة من منصة اعتماد. أدخل معرف المناقصة المعروف باسم tenderIdString.</p>
                  <p>يمكنك استخراج هذا المعرف من URL مناقصات منصة اعتماد.</p>
                </div>
                
                <div className="flex items-end space-x-2 space-x-reverse">
                  <div className="flex-1">
                    <Label htmlFor="stenderId" className="mb-2 block text-sm">معرف المناقصة (tenderIdString)</Label>
                    <Input
                      id="stenderId"
                      placeholder="أدخل معرف المناقصة من منصة اعتماد..."
                      className="flex-1"
                      value={tenderId}
                      onChange={(e) => setTenderId(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <Button 
                      variant="default"
                      className="py-2"
                      disabled={!tenderId || isTesting}
                      onClick={async () => {
                        try {
                          setIsTesting(true);
                          setTestResult(null);
                          
                          const response = await apiRequest("POST", "/api/test-etimad-tender", {
                            tenderId
                          });
                          
                          const data = await response.json();
                          setTestResult(data);
                          
                          if (data.success) {
                            toast({
                              title: "تم الاتصال بمنصة اعتماد",
                              description: `تم العثور على المناقصة: ${data.details?.title || 'عنوان غير متوفر'}`,
                              variant: "default",
                            });
                          } else {
                            toast({
                              title: "فشل الاتصال بمنصة اعتماد",
                              description: data.error || "حدث خطأ أثناء محاولة الاتصال بمنصة اعتماد",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          console.error("Error testing tender ID:", error);
                          setTestResult({
                            success: false,
                            error: error instanceof Error ? error.message : "حدث خطأ غير معروف"
                          });
                          toast({
                            title: "فشل اختبار معرف المناقصة",
                            description: "حدث خطأ أثناء محاولة اختبار معرف المناقصة",
                            variant: "destructive",
                          });
                        } finally {
                          setIsTesting(false);
                        }
                      }}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الفحص...
                        </>
                      ) : (
                        "فحص المعرف"
                      )}
                    </Button>
                    
                    <a 
                      href={`https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=${encodeURIComponent(tenderId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center hover:bg-blue-100 transition-colors"
                    >
                      فتح الرابط <ExternalLink className="h-4 w-4 mr-1" />
                    </a>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-xs text-gray-500">الرابط الناتج:</p>
                  <code className="text-xs block border mt-1 p-2 rounded-md bg-gray-50 dark:bg-gray-900 overflow-x-auto">
                    https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString={encodeURIComponent(tenderId)}
                  </code>
                </div>

                {testResult && (
                  <div className={`mt-4 p-4 rounded-md ${testResult.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {testResult.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <p className="font-medium">{testResult.success ? "تم الاتصال بنجاح" : "فشل الاتصال"}</p>
                    </div>
                    
                    {testResult.success && testResult.details && (
                      <div className="mt-2 space-y-2">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="details">
                            <AccordionTrigger className="py-2 text-sm font-medium">عرض تفاصيل المناقصة</AccordionTrigger>
                            <AccordionContent>
                              <div className="text-sm space-y-2 mt-2">
                                <div className="grid grid-cols-1 gap-2">
                                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                    <span className="font-medium">العنوان:</span> {testResult.details.title || "غير متوفر"}
                                  </div>
                                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                    <span className="font-medium">الجهة:</span> {testResult.details.agency || "غير متوفر"}
                                  </div>
                                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                    <span className="font-medium">الوصف:</span> {testResult.details.description || "غير متوفر"}
                                  </div>
                                  <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                                    <span className="font-medium">رقم العطاء:</span> {testResult.details.bidNumber || "غير متوفر"}
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                    
                    {!testResult.success && (
                      <div className="mt-2 space-y-2 text-sm">
                        <p><span className="font-medium">الخطأ:</span> {testResult.error || "خطأ غير معروف"}</p>
                        {testResult.status && (
                          <p><span className="font-medium">رمز الاستجابة:</span> {testResult.status}</p>
                        )}
                        <p>
                          يرجى التأكد من أن معرف المناقصة صحيح وأن منصة اعتماد متاحة. بعض المناقصات قد تكون متاحة فقط للمستخدمين المسجلين.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-300 mr-2">ملاحظات حول تكامل منصة اعتماد</AlertTitle>
                <AlertDescription className="text-amber-700 dark:text-amber-400 mr-6">
                  <ul className="list-disc mr-4 mt-2 space-y-1 text-sm">
                    <li>تأكد من أن معرف المناقصة (tenderIdString) صحيح للتمكن من الوصول إلى المناقصة بشكل صحيح.</li>
                    <li>تتطلب بعض المناقصات تسجيل الدخول في منصة اعتماد للوصول إليها.</li>
                    <li>يمكن للمستخدم الاطلاع على المناقصات بدون تسجيل دخول ولكن لتقديم طلب يجب تسجيل الدخول.</li>
                  </ul>
                </AlertDescription>
              </Alert>
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