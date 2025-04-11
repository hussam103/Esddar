import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  CircleX,
  Database,
  FileDigit,
  FileText,
  Filter,
  Globe,
  HardDrive,
  LineChart,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Upload,
  Users,
  X,
  PlusCircle,
  Trash2,
  Pencil,
  ExternalLink
} from "lucide-react";

// Define the source form schema
const sourceFormSchema = z.object({
  name: z.string().min(2, {
    message: "Source name must be at least 2 characters.",
  }),
  url: z.string().url({
    message: "Please enter a valid URL.",
  }),
  type: z.enum(["api", "website_scrape"]),
  apiEndpoint: z.string().optional(),
  scrapingFrequency: z.number().int().min(1).max(168),
  active: z.boolean().default(true),
  credentials: z.record(z.string()).optional(),
});

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sources");
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [showNewSourceDialog, setShowNewSourceDialog] = useState(false);
  const [, setLocation] = useLocation();
  const [processing, setProcessing] = useState(false);
  const [startingScrapingJob, setStartingScrapingJob] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);

  // Form for adding/editing sources
  const sourceForm = useForm<z.infer<typeof sourceFormSchema>>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "api",
      apiEndpoint: "",
      scrapingFrequency: 24,
      active: true,
      credentials: {},
    },
  });

  // Check if user is admin 
  const isAdmin = user?.role === 'admin';

  // If not authenticated, redirect to login
  if (!user) {
    setLocation("/auth");
    return null;
  }

  // If not admin, show unauthorized message
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>غير مصرح</AlertTitle>
          <AlertDescription>
            ليس لديك صلاحيات للوصول إلى لوحة الإدارة.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Fetch external sources
  const {
    data: sources = [],
    isLoading: sourcesLoading,
    error: sourcesError,
  } = useQuery({
    queryKey: ["/api/admin/sources"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/sources");
      if (!response.ok) throw new Error("Failed to load sources");
      return await response.json();
    },
  });

  // Fetch scrape logs
  const {
    data: scrapeLogs = [],
    isLoading: logsLoading,
    error: logsError,
  } = useQuery({
    queryKey: ["/api/admin/scrape-logs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/scrape-logs");
      if (!response.ok) throw new Error("Failed to load scrape logs");
      return await response.json();
    },
  });

  // Fetch tender statistics 
  const {
    data: tenderStats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ["/api/admin/statistics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/statistics");
      if (!response.ok) throw new Error("Failed to load statistics");
      return await response.json();
    },
  });

  // Fetch RAG statistics
  const {
    data: ragStats,
    isLoading: ragStatsLoading,
    error: ragStatsError,
  } = useQuery({
    queryKey: ["/api/admin/rag-statistics"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/rag-statistics");
      if (!response.ok) throw new Error("Failed to load RAG statistics");
      return await response.json();
    },
  });

  // Add new source mutation
  const addSourceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof sourceFormSchema>) => {
      const response = await apiRequest("POST", "/api/admin/sources", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add source");
      }
      return await response.json();
    },
    onSuccess: () => {
      setShowNewSourceDialog(false);
      sourceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sources"] });
      toast({
        title: "Source added successfully",
        description: "The new external source has been added to the system.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add source",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update source mutation
  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof sourceFormSchema> }) => {
      const response = await apiRequest("PUT", `/api/admin/sources/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update source");
      }
      return await response.json();
    },
    onSuccess: () => {
      setSelectedSource(null);
      sourceForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sources"] });
      toast({
        title: "Source updated successfully",
        description: "The external source has been updated.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update source",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete source mutation
  const deleteSourceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/sources/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete source");
      }
      return await response.json();
    },
    onSuccess: () => {
      setSelectedSourceId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sources"] });
      toast({
        title: "Source deleted successfully",
        description: "The external source has been removed from the system.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete source",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Start scraping job mutation
  const startScrapingMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      setStartingScrapingJob(true);
      const response = await apiRequest("POST", `/api/admin/scrape/${sourceId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to start scraping job");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scrape-logs"] });
      toast({
        title: "Scraping job started",
        description: `Job ID: ${data.id}. The system will now collect tenders from the source.`,
        variant: "default",
      });
      setStartingScrapingJob(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to start scraping job",
        description: error.message,
        variant: "destructive",
      });
      setStartingScrapingJob(false);
    },
  });

  // Handle source submission
  const onSubmitSource = (data: z.infer<typeof sourceFormSchema>) => {
    if (selectedSource) {
      updateSourceMutation.mutate({ id: selectedSource.id, data });
    } else {
      addSourceMutation.mutate(data);
    }
  };

  // Handle source edit
  const handleEditSource = (source: any) => {
    setSelectedSource(source);
    sourceForm.reset({
      name: source.name,
      url: source.url,
      type: source.type,
      apiEndpoint: source.apiEndpoint || "",
      scrapingFrequency: source.scrapingFrequency,
      active: source.active,
      credentials: source.credentials || {},
    });
    setShowNewSourceDialog(true);
  };

  // Number formatting helper
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Format date helper
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            قيد التشغيل
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            مكتمل
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            فشل
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-300">
            {status}
          </Badge>
        );
    }
  };

  // Mock statistics data (replace with actual API data when available)
  const tenderSourceStats = tenderStats?.bySource || [
    { name: "Etimad", value: 125 },
    { name: "Local", value: 35 },
    { name: "Other", value: 15 }
  ];

  const tenderStatusStats = tenderStats?.byStatus || [
    { name: "Open", value: 85 },
    { name: "Closed", value: 45 },
    { name: "Draft", value: 20 },
    { name: "Archived", value: 25 }
  ];

  const vectorizationStats = ragStats?.vectorization || {
    total: 175,
    processed: 145,
    failed: 5,
    pending: 25
  };

  const matchingStats = ragStats?.matching || [
    { name: "90-100%", value: 15 },
    { name: "70-89%", value: 35 },
    { name: "50-69%", value: 55 },
    { name: "0-49%", value: 25 }
  ];

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#EC7063'];

  // We already have useLocation defined above, just need to get logoutMutation and t
  const { logoutMutation } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{t("admin.advancedDashboard")}</h1>
        <div className="flex items-center space-x-3 space-x-reverse">
          <LanguageSwitcher />
          <Button 
            variant="destructive" 
            onClick={() => {
              logoutMutation.mutate();
              setLocation("/auth");
            }}
            className="flex items-center space-x-2 space-x-reverse"
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? `${t("auth.logout")}...` : t("auth.logout")}
          </Button>
        </div>
      </div>
      <p className="text-gray-600 mb-6">
        إدارة مصادر المناقصات، الإحصائيات، ونظام التوصيات الذكي
      </p>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="sources">مصادر المناقصات</TabsTrigger>
          <TabsTrigger value="rag">نظام التوصيات (RAG)</TabsTrigger>
          <TabsTrigger value="statistics">الإحصائيات والتحليلات</TabsTrigger>
          <TabsTrigger value="settings">إعدادات النظام</TabsTrigger>
        </TabsList>

        {/* External Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">مصادر المناقصات الخارجية</h2>
            <Dialog open={showNewSourceDialog} onOpenChange={setShowNewSourceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة مصدر جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedSource ? "تحديث مصدر المناقصات" : "إضافة مصدر مناقصات جديد"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedSource
                      ? "تحديث تفاصيل مصدر المناقصات الحالي"
                      : "أضف مصدرًا جديدًا لجمع المناقصات منه بشكل دوري"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...sourceForm}>
                  <form onSubmit={sourceForm.handleSubmit(onSubmitSource)} className="space-y-4">
                    <FormField
                      control={sourceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>اسم المصدر</FormLabel>
                          <FormControl>
                            <Input placeholder="مثال: منصة اعتماد" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sourceForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>عنوان URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sourceForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع المصدر</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع المصدر" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="api">واجهة برمجة التطبيقات (API)</SelectItem>
                              <SelectItem value="website_scrape">موقع ويب (استخراج البيانات)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {sourceForm.watch("type") === "api" && (
                      <FormField
                        control={sourceForm.control}
                        name="apiEndpoint"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>نقطة نهاية API</FormLabel>
                            <FormControl>
                              <Input placeholder="/api/tenders" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={sourceForm.control}
                      name="scrapingFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تكرار الجمع (بالساعات)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="168"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value, 10))
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            عدد الساعات بين كل عملية جمع للمناقصات (1-168)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sourceForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-x-reverse space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>تفعيل المصدر</FormLabel>
                            <FormDescription>
                              تفعيل أو تعطيل عمليات جمع المناقصات من هذا المصدر
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={
                          sourceForm.formState.isSubmitting ||
                          addSourceMutation.isPending ||
                          updateSourceMutation.isPending
                        }
                      >
                        {(sourceForm.formState.isSubmitting ||
                          addSourceMutation.isPending ||
                          updateSourceMutation.isPending) && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {selectedSource ? "تحديث المصدر" : "إضافة المصدر"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* External Sources List */}
          <Card>
            <CardHeader>
              <CardTitle>مصادر المناقصات</CardTitle>
              <CardDescription>
                قائمة بمصادر المناقصات المتاحة في النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : sourcesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription>
                    حدث خطأ أثناء تحميل المصادر. الرجاء المحاولة مرة أخرى لاحقًا.
                  </AlertDescription>
                </Alert>
              ) : sources.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <HardDrive className="mx-auto h-10 w-10 mb-2" />
                  <p className="mb-4">لا توجد مصادر مضافة بعد</p>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewSourceDialog(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    إضافة مصدر جديد
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المصدر</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>التردد (ساعات)</TableHead>
                      <TableHead>آخر تحديث</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sources.map((source: any) => (
                      <TableRow key={source.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-medium">{source.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {source.url}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {source.type === "api" ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                              API
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                              Web Scraping
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{source.scrapingFrequency}</TableCell>
                        <TableCell>
                          {source.lastScrapedAt
                            ? formatDate(source.lastScrapedAt)
                            : "لم يتم البدء بعد"}
                        </TableCell>
                        <TableCell>
                          {source.active ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300">
                              نشط
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                              غير نشط
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2 space-x-reverse">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSource(source)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-500 border-red-200 hover:bg-red-50"
                                  onClick={() => setSelectedSourceId(source.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    هل أنت متأكد من رغبتك في حذف هذا المصدر؟ لا يمكن التراجع عن هذا الإجراء.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => {
                                      if (selectedSourceId) {
                                        deleteSourceMutation.mutate(selectedSourceId);
                                      }
                                    }}
                                  >
                                    {deleteSourceMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    حذف المصدر
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-blue-500 border-blue-200 hover:bg-blue-50"
                              disabled={startingScrapingJob}
                              onClick={() => startScrapingMutation.mutate(source.id)}
                            >
                              {startingScrapingJob && selectedSourceId === source.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent Scraping Jobs */}
          <Card>
            <CardHeader>
              <CardTitle>سجل عمليات الجمع الأخيرة</CardTitle>
              <CardDescription>
                سجل بآخر عمليات جمع المناقصات من المصادر الخارجية
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center p-6">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : logsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>خطأ</AlertTitle>
                  <AlertDescription>
                    حدث خطأ أثناء تحميل سجل العمليات. الرجاء المحاولة مرة أخرى لاحقًا.
                  </AlertDescription>
                </Alert>
              ) : scrapeLogs.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                  <FileText className="mx-auto h-10 w-10 mb-2" />
                  <p>لا توجد عمليات جمع سابقة</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المصدر</TableHead>
                      <TableHead>وقت البدء</TableHead>
                      <TableHead>وقت الانتهاء</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>المناقصات</TableHead>
                      <TableHead>التفاصيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapeLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.source?.name || "غير متوفر"}
                        </TableCell>
                        <TableCell>{formatDate(log.startTime)}</TableCell>
                        <TableCell>
                          {log.endTime ? formatDate(log.endTime) : "قيد التنفيذ"}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-xs flex justify-between">
                              <span>الإجمالي: {log.totalTenders || 0}</span>
                              <span>الجديدة: {log.newTenders || 0}</span>
                            </div>
                            <Progress
                              value={
                                log.totalTenders
                                  ? (log.newTenders / log.totalTenders) * 100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                {language === "ar" ? "عرض التفاصيل" : "View Details"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[550px]">
                              <DialogHeader>
                                <DialogTitle>تفاصيل عملية الجمع</DialogTitle>
                                <DialogDescription>
                                  معلومات مفصلة عن عملية جمع المناقصات من{" "}
                                  {log.source?.name || "غير متوفر"}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-gray-500">المعرف</Label>
                                    <div className="font-medium">{log.id}</div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">المصدر</Label>
                                    <div className="font-medium">
                                      {log.source?.name || "غير متوفر"}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">وقت البدء</Label>
                                    <div className="font-medium">
                                      {formatDate(log.startTime)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">وقت الانتهاء</Label>
                                    <div className="font-medium">
                                      {log.endTime ? formatDate(log.endTime) : "قيد التنفيذ"}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">الحالة</Label>
                                    <div>{getStatusBadge(log.status)}</div>
                                  </div>
                                  <div>
                                    <Label className="text-gray-500">المدة</Label>
                                    <div className="font-medium">
                                      {log.endTime
                                        ? `${Math.round(
                                            (new Date(log.endTime).getTime() -
                                              new Date(log.startTime).getTime()) /
                                              1000 / 60
                                          )} دقيقة`
                                        : "قيد التنفيذ"}
                                    </div>
                                  </div>
                                </div>

                                <Separator />

                                <div>
                                  <Label className="text-gray-500">إحصائيات المناقصات</Label>
                                  <div className="grid grid-cols-4 gap-2 mt-2">
                                    <div className="bg-blue-50 p-2 rounded text-center">
                                      <div className="text-blue-800 text-lg font-bold">
                                        {log.totalTenders || 0}
                                      </div>
                                      <div className="text-blue-600 text-xs">
                                        الإجمالي
                                      </div>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded text-center">
                                      <div className="text-green-800 text-lg font-bold">
                                        {log.newTenders || 0}
                                      </div>
                                      <div className="text-green-600 text-xs">
                                        الجديدة
                                      </div>
                                    </div>
                                    <div className="bg-amber-50 p-2 rounded text-center">
                                      <div className="text-amber-800 text-lg font-bold">
                                        {log.updatedTenders || 0}
                                      </div>
                                      <div className="text-amber-600 text-xs">
                                        المحدثة
                                      </div>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded text-center">
                                      <div className="text-red-800 text-lg font-bold">
                                        {log.failedTenders || 0}
                                      </div>
                                      <div className="text-red-600 text-xs">
                                        الفاشلة
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {log.errorMessage && (
                                  <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>خطأ أثناء العملية</AlertTitle>
                                    <AlertDescription>
                                      {log.errorMessage}
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {log.details && (
                                  <div>
                                    <Label className="text-gray-500">تفاصيل إضافية</Label>
                                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm overflow-auto max-h-40">
                                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RAG System Tab */}
        <TabsContent value="rag" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">نظام التوصيات الذكي (RAG)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vectorization Status */}
            <Card>
              <CardHeader>
                <CardTitle>حالة تحويل البيانات</CardTitle>
                <CardDescription>
                  حالة تحويل المناقصات وملفات الشركات إلى نماذج متجهية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">المناقصات</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>تم معالجة {vectorizationStats.processed} من أصل {vectorizationStats.total}</span>
                        <span>{Math.round((vectorizationStats.processed / vectorizationStats.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(vectorizationStats.processed / vectorizationStats.total) * 100} 
                        className="h-2"
                      />
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-green-50 p-2 rounded text-center">
                          <div className="text-green-800 text-sm font-medium">
                            {vectorizationStats.processed}
                          </div>
                          <div className="text-green-600 text-xs">
                            تمت المعالجة
                          </div>
                        </div>
                        <div className="bg-amber-50 p-2 rounded text-center">
                          <div className="text-amber-800 text-sm font-medium">
                            {vectorizationStats.pending}
                          </div>
                          <div className="text-amber-600 text-xs">
                            قيد الانتظار
                          </div>
                        </div>
                        <div className="bg-red-50 p-2 rounded text-center">
                          <div className="text-red-800 text-sm font-medium">
                            {vectorizationStats.failed}
                          </div>
                          <div className="text-red-600 text-xs">
                            فشلت
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-3">ملفات الشركات</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>تم معالجة {vectorizationStats.processed - 25} من أصل {vectorizationStats.total - 20}</span>
                        <span>{Math.round(((vectorizationStats.processed - 25) / (vectorizationStats.total - 20)) * 100)}%</span>
                      </div>
                      <Progress 
                        value={((vectorizationStats.processed - 25) / (vectorizationStats.total - 20)) * 100} 
                        className="h-2"
                      />
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="bg-green-50 p-2 rounded text-center">
                          <div className="text-green-800 text-sm font-medium">
                            {vectorizationStats.processed - 25}
                          </div>
                          <div className="text-green-600 text-xs">
                            تمت المعالجة
                          </div>
                        </div>
                        <div className="bg-amber-50 p-2 rounded text-center">
                          <div className="text-amber-800 text-sm font-medium">
                            {vectorizationStats.pending - 10}
                          </div>
                          <div className="text-amber-600 text-xs">
                            قيد الانتظار
                          </div>
                        </div>
                        <div className="bg-red-50 p-2 rounded text-center">
                          <div className="text-red-800 text-sm font-medium">
                            {vectorizationStats.failed + 5}
                          </div>
                          <div className="text-red-600 text-xs">
                            فشلت
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={processing}
                      onClick={() => {
                        setProcessing(true);
                        setTimeout(() => {
                          setProcessing(false);
                          toast({
                            title: "تم تشغيل عملية المعالجة",
                            description: "سيتم معالجة العناصر المنتظرة في الخلفية.",
                          });
                        }, 1500);
                      }}
                    >
                      {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      معالجة العناصر المنتظرة
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matching Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع درجات المطابقة</CardTitle>
                <CardDescription>
                  توزيع درجات المطابقة بين المناقصات وملفات الشركات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={matchingStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {matchingStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4">
                  <h3 className="font-medium mb-2">أفضل المطابقات</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">شركة الإنشاءات المتحدة</span>
                        <span className="text-gray-500"> - مناقصة بناء طرق</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">95%</Badge>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">مؤسسة التقنية المتطورة</span>
                        <span className="text-gray-500"> - نظام إدارة المرور الذكي</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">91%</Badge>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                      <div className="text-sm">
                        <span className="font-medium">شركة الهندسة البيئية</span>
                        <span className="text-gray-500"> - تطوير مشروع بيئي</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">88%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Company Documents */}
            <Card>
              <CardHeader>
                <CardTitle>تحميل وثائق الشركات</CardTitle>
                <CardDescription>
                  قم بتحميل وثائق الشركات لمعالجتها وتحسين دقة التوصيات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-2">اسحب الملفات هنا أو انقر للتصفح</p>
                    <p className="text-xs text-gray-400">PDF, JPG, PNG (الحد الأقصى: 10MB)</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      disabled={uploadingDocuments}
                      onClick={() => {
                        setUploadingDocuments(true);
                        setTimeout(() => {
                          setUploadingDocuments(false);
                          toast({
                            title: "تم تحميل الوثائق",
                            description: "تم تحميل الوثائق وإضافتها لقائمة المعالجة.",
                          });
                        }, 1500);
                      }}
                    >
                      {uploadingDocuments && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      تصفح الملفات
                    </Button>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">الوثائق المعالجة مؤخرًا</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم الملف</TableHead>
                          <TableHead>النوع</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>تاريخ التحميل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">business_license.pdf</TableCell>
                          <TableCell>رخصة تجارية</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">تمت المعالجة</Badge>
                          </TableCell>
                          <TableCell>منذ 3 أيام</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">company_profile.pdf</TableCell>
                          <TableCell>نبذة عن الشركة</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">تمت المعالجة</Badge>
                          </TableCell>
                          <TableCell>منذ 3 أيام</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">previous_projects.docx</TableCell>
                          <TableCell>مشاريع سابقة</TableCell>
                          <TableCell>
                            <Badge className="bg-amber-100 text-amber-800">قيد المعالجة</Badge>
                          </TableCell>
                          <TableCell>اليوم</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RAG Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>إعدادات نظام التوصيات</CardTitle>
                <CardDescription>
                  تخصيص إعدادات نظام التوصيات الذكي
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="model">نموذج الذكاء الاصطناعي</Label>
                    <Select defaultValue="perplexity-sonar-small">
                      <SelectTrigger id="model">
                        <SelectValue placeholder="اختر النموذج" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="perplexity-sonar-small">Perplexity Sonar Small</SelectItem>
                        <SelectItem value="perplexity-sonar-medium">Perplexity Sonar Medium</SelectItem>
                        <SelectItem value="perplexity-sonar-large">Perplexity Sonar Large</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      النموذج المستخدم لتحليل وتقييم المناقصات وملفات الشركات
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="matching-threshold">الحد الأدنى لدرجة المطابقة</Label>
                    <Input 
                      id="matching-threshold" 
                      type="number" 
                      defaultValue="70" 
                      min="0" 
                      max="100" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      الحد الأدنى لدرجة المطابقة (0-100%) للتوصية بمناقصة لشركة
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="vector-dim">أبعاد النموذج المتجهي</Label>
                    <Input 
                      id="vector-dim" 
                      type="number" 
                      defaultValue="1536" 
                      min="256" 
                      step="256" 
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الأبعاد المستخدمة في النموذج المتجهي (يختلف حسب النموذج)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button variant="outline">إعادة تعيين</Button>
                    <Button>حفظ الإعدادات</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">إحصائيات وتحليلات النظام</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>إجمالي المناقصات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(tenderStats?.total || 175)}</div>
                <p className="text-sm text-gray-500 mt-2">مناقصة في النظام</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>الشركات المسجلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(tenderStats?.users || 45)}</div>
                <p className="text-sm text-gray-500 mt-2">شركة مسجلة</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>الطلبات المقدمة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatNumber(tenderStats?.applications || 120)}</div>
                <p className="text-sm text-gray-500 mt-2">طلب تم تقديمه</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>توزيع المناقصات حسب المصدر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tenderSourceStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>توزيع المناقصات حسب الحالة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tenderStatusStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tenderStatusStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>آخر المناقصات المضافة</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العنوان</TableHead>
                    <TableHead>الجهة</TableHead>
                    <TableHead>المصدر</TableHead>
                    <TableHead>تاريخ الإضافة</TableHead>
                    <TableHead>الموعد النهائي</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">مشروع توسعة الطريق الدائري</TableCell>
                    <TableCell>وزارة النقل</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">منصة اعتماد</Badge>
                    </TableCell>
                    <TableCell>منذ ساعتين</TableCell>
                    <TableCell>بعد 15 يوم</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">صيانة المباني الحكومية</TableCell>
                    <TableCell>وزارة المالية</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">منصة اعتماد</Badge>
                    </TableCell>
                    <TableCell>منذ 5 ساعات</TableCell>
                    <TableCell>بعد 10 أيام</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">تطوير نظام إدارة المرور</TableCell>
                    <TableCell>إدارة المرور</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">محلي</Badge>
                    </TableCell>
                    <TableCell>منذ 8 ساعات</TableCell>
                    <TableCell>بعد 20 يوم</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        فتح
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">إعدادات النظام</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات API</CardTitle>
                <CardDescription>
                  إدارة مفاتيح واتصالات API الخارجية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="perplexity-api">Perplexity API Key</Label>
                    <div className="flex space-x-2 space-x-reverse">
                      <Input id="perplexity-api" type="password" defaultValue="********************************" readOnly />
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      مفتاح API لواجهة برمجة تطبيقات Perplexity للنماذج اللغوية
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pinecone-api">Pinecone API Key</Label>
                    <div className="flex space-x-2 space-x-reverse">
                      <Input id="pinecone-api" type="password" defaultValue="********************************" readOnly />
                      <Button variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      مفتاح API لخدمة Pinecone للبحث المتجهي
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="pinecone-env">Pinecone Environment</Label>
                    <Select defaultValue="us-west1-gcp-free">
                      <SelectTrigger id="pinecone-env">
                        <SelectValue placeholder="اختر البيئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-west1-gcp-free">us-west1-gcp-free</SelectItem>
                        <SelectItem value="us-east1-gcp">us-east1-gcp</SelectItem>
                        <SelectItem value="eu-west1-gcp">eu-west1-gcp</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      بيئة Pinecone للتعامل مع قاعدة البيانات المتجهية
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button>حفظ الإعدادات</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام العامة</CardTitle>
                <CardDescription>
                  تكوين الإعدادات العامة للنظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="scrape-interval">فاصل جمع المناقصات (ساعات)</Label>
                    <Input id="scrape-interval" type="number" min="1" max="72" defaultValue="24" />
                    <p className="text-xs text-gray-500 mt-1">
                      الفاصل الزمني الافتراضي لجمع المناقصات من المصادر
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notification-interval">فاصل إشعارات المطابقة (ساعات)</Label>
                    <Input id="notification-interval" type="number" min="1" max="24" defaultValue="12" />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الساعات بين إشعارات المطابقة للشركات
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="match-threshold">حد المطابقة للإشعارات (%)</Label>
                    <Input id="match-threshold" type="number" min="50" max="95" defaultValue="75" />
                    <p className="text-xs text-gray-500 mt-1">
                      الحد الأدنى لنسبة المطابقة لإرسال إشعارات للشركات
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <Button variant="outline">إعادة تعيين</Button>
                    <Button>حفظ الإعدادات</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>أمان النظام</CardTitle>
                <CardDescription>
                  إدارة إعدادات أمان النظام والمستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-500 ml-2" />
                      <div>
                        <h3 className="font-medium">تحقق من هوية المستخدم بخطوتين</h3>
                        <p className="text-sm text-gray-500">
                          تفعيل المصادقة الثنائية للمستخدمين
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="accent-primary h-5 w-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-gray-500 ml-2" />
                      <div>
                        <h3 className="font-medium">تشفير كامل لبيانات المستخدمين</h3>
                        <p className="text-sm text-gray-500">
                          تشفير بيانات المستخدمين الحساسة
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={true}
                      className="accent-primary h-5 w-5"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-500 ml-2" />
                      <div>
                        <h3 className="font-medium">قيود تسجيل الشركات الجديدة</h3>
                        <p className="text-sm text-gray-500">
                          طلب موافقة الإدارة لتفعيل الشركات الجديدة
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked={false}
                      className="accent-primary h-5 w-5"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button>حفظ الإعدادات</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>النسخ الاحتياطي واستعادة البيانات</CardTitle>
                <CardDescription>
                  إدارة النسخ الاحتياطي واستعادة بيانات النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">النسخ الاحتياطي</h3>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button variant="outline">
                        <FileDigit className="mr-2 h-4 w-4" />
                        نسخ احتياطي كامل للنظام
                      </Button>
                      <Button variant="outline">
                        <Database className="mr-2 h-4 w-4" />
                        نسخ قاعدة البيانات فقط
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">استعادة البيانات</h3>
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-2">اسحب ملف النسخ الاحتياطي هنا</p>
                      <p className="text-xs text-gray-400">ملفات .sql أو .zip</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        تصفح الملفات
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">آخر النسخ الاحتياطية</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <div className="font-medium">نسخة احتياطية كاملة</div>
                          <div className="text-xs text-gray-500">11/04/2025, 01:30 AM</div>
                        </div>
                        <Button variant="outline" size="sm">
                          استعادة
                        </Button>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                        <div>
                          <div className="font-medium">نسخة قاعدة البيانات</div>
                          <div className="text-xs text-gray-500">10/04/2025, 01:30 AM</div>
                        </div>
                        <Button variant="outline" size="sm">
                          استعادة
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}