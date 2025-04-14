import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tender, UserProfile } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  RefreshCw, 
  ClipboardList, 
  Bell, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  TrendingUp, 
  Building2, 
  BarChartHorizontal,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Search 
} from "lucide-react";
import { formatDistance } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

// Custom application type
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

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRTL = language === "ar";
  const dateLocale = isRTL ? arSA : enUS;

  // Fetch all tenders
  const { data: tenders = [], isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });
  
  // Fetch recommended tenders (top matches)
  const { data: recommendedTenders = [], isLoading: recommendedTendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/recommended-tenders"],
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user-profile"],
  });

  // Fetch applications
  const { data: fetchedApplications = [], isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ["/api/applications"],
  });
  
  // Fetch saved tenders
  const { data: savedTenders = [], isLoading: savedTendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/saved-tenders"],
  });
  
  // Function to refresh recommendations
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/refresh-recommended-tenders");
      return await response.json();
    },
    onMutate: () => {
      setIsRefreshing(true);
    },
    onSuccess: (data) => {
      // Invalidate tender queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["/api/tenders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommended-tenders"] });
      
      toast({
        title: isRTL ? "تم تحديث المناقصات" : "Tenders Refreshed",
        description: isRTL
          ? "تم تحديث قائمة المناقصات الموصى بها بنجاح"
          : data.message || "Successfully refreshed recommended tenders"
      });
    },
    onError: (error: any) => {
      toast({
        title: isRTL ? "فشل تحديث المناقصات" : "Refresh Failed",
        description: error.message || "An error occurred while refreshing tenders",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    }
  });

  // Transform applications data
  const applications: CustomApplication[] = fetchedApplications.map(app => ({
    ...app,
    submittedAt: app.submittedAt || null,
    proposalContent: app.proposalContent || null,
    documents: app.documents || null,
    matchScore: app.matchScore || null,
    tender: app.tender
  }));

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Get days remaining until deadline
  const getDaysRemaining = (deadline: Date): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Get match score from tender
  const getMatchScore = (tender: Tender): number => {
    // First check if the tender has a matchScore property
    if (tender.matchScore !== undefined && tender.matchScore !== null) {
      // If matchScore is a string, parse it to a number
      return typeof tender.matchScore === 'string' 
        ? Math.round(parseFloat(tender.matchScore)) 
        : Number(tender.matchScore);
    }
    
    // If not, try to extract from rawData
    if (tender.rawData) {
      try {
        const rawData = JSON.parse(tender.rawData);
        if (rawData.similarity_percentage) {
          return Math.round(parseFloat(String(rawData.similarity_percentage)));
        }
      } catch (e) {
        console.error('Error parsing tender rawData:', e);
      }
    }
    
    // Default no-match score
    return 0;
  };

  // Get active applications count
  const activeApplicationsCount = applications.filter(app => 
    app.status === 'pending' || app.status === 'submitted' || app.status === 'in_review'
  ).length;

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = applications
    .filter(app => app.tender && app.status !== 'rejected' && app.status !== 'awarded')
    .filter(app => {
      const tender = tenders.find(t => t.id === app.tenderId);
      if (!tender) return false;
      
      const daysRemaining = getDaysRemaining(tender.deadline);
      return daysRemaining <= 7 && daysRemaining > 0;
    })
    .slice(0, 3);

  // Profile completeness
  const profileCompleteness = user?.profileCompleteness || 0;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={t("nav.dashboard")} 
          subtitle={isRTL
            ? `مرحباً بعودتك، ${user?.companyName}`
            : `Welcome back, ${user?.companyName}`}
          toggleMobileMenu={toggleMobileMenu}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tender Matches Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  {isRTL ? "المناقصات المطابقة" : "Tender Matches"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recommendedTenders.length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL ? "مناقصات مطابقة لملف شركتك" : "Matches found for your profile"}
                </p>
              </CardContent>
            </Card>

            {/* Active Applications Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  {isRTL ? "الطلبات النشطة" : "Active Applications"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeApplicationsCount}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL ? "طلبات قيد المراجعة حالياً" : "Applications under review"}
                </p>
              </CardContent>
            </Card>

            {/* Saved Tenders Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  {isRTL ? "المناقصات المحفوظة" : "Saved Tenders"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savedTendersLoading ? <Skeleton className="h-8 w-16" /> : savedTenders.length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL ? "مناقصات محفوظة للمراجعة لاحقاً" : "Tenders saved for review"}
                </p>
              </CardContent>
            </Card>

            {/* Upcoming Deadlines Card */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {isRTL ? "المواعيد النهائية" : "Deadlines"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRTL ? "مواعيد نهائية خلال 7 أيام" : "Deadlines within 7 days"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Completeness Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  {isRTL ? "اكتمال الملف التعريفي" : "Profile Completeness"}
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/profile")}
                  className="text-primary hover:bg-primary/5"
                >
                  {isRTL ? "تحديث" : "Update"}
                </Button>
              </div>
              <CardDescription>
                {isRTL ? "ملف شركة مكتمل يزيد من فرصك في العثور على مناقصات مناسبة" : 
                "A complete profile increases your chances of finding suitable tenders"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{profileCompleteness}%</span>
                  <span>{profileCompleteness < 100 ? (isRTL ? "غير مكتمل" : "Incomplete") : (isRTL ? "مكتمل" : "Complete")}</span>
                </div>
                <Progress value={profileCompleteness} className="h-2" />
                
                {profileCompleteness < 100 && (
                  <div className="flex justify-between items-center mt-4 text-sm bg-amber-50 dark:bg-amber-950/50 p-3 rounded-md">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-amber-700 dark:text-amber-300">
                        {isRTL ? "أضف وصف الشركة" : "Add company description"}
                      </span>
                    </div>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-amber-700 dark:text-amber-300"
                      onClick={() => setLocation("/profile")}
                    >
                      {isRTL ? "أضف الآن" : "Add now"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Main tabs for content */}
          <Tabs defaultValue="recommended" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="recommended">
                <Award className="h-4 w-4 mr-2" />
                {isRTL ? "المناقصات الموصى بها" : "Recommended"}
              </TabsTrigger>
              <TabsTrigger value="active">
                <ClipboardList className="h-4 w-4 mr-2" />
                {isRTL ? "طلباتي النشطة" : "My Applications"}
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                <Calendar className="h-4 w-4 mr-2" />
                {isRTL ? "المواعيد القادمة" : "Upcoming"}
              </TabsTrigger>
            </TabsList>
            
            {/* Recommended Tenders Tab */}
            <TabsContent value="recommended" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isRTL ? "المناقصات الموصى بها" : "Recommended Tenders"}
                </h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-primary bg-white border-primary/20 hover:bg-primary/5 flex items-center gap-1"
                    onClick={() => refreshMutation.mutate()}
                    disabled={isRefreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    {isRTL 
                      ? (isRefreshing ? "جاري التحديث..." : "تحديث")
                      : (isRefreshing ? "Refreshing..." : "Refresh")}
                  </Button>
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => setLocation("/tenders")}
                  >
                    {isRTL ? "عرض الكل" : "View All"}
                  </Button>
                </div>
              </div>
              
              {recommendedTendersLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border rounded-lg overflow-hidden">
                      <CardHeader className="pb-0">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent className="pb-0">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-9 w-full mt-2" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : recommendedTenders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {recommendedTenders.slice(0, 3).map((tender) => {
                    const matchScore = getMatchScore(tender);
                    const daysRemaining = getDaysRemaining(tender.deadline);
                    
                    return (
                      <Card key={tender.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="relative">
                          {matchScore > 0 && (
                            <div className="absolute top-2 right-2 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md shadow-sm z-10 flex items-center">
                              <span className="flex items-center gap-1">
                                <Award className="h-3 w-3" />
                                {matchScore}% {isRTL ? "تطابق" : "Match"}
                              </span>
                            </div>
                          )}
                          
                          <CardHeader className="pb-1">
                            <CardTitle className="text-md leading-tight line-clamp-2" title={tender.title}>
                              {tender.title}
                            </CardTitle>
                            <CardDescription className="flex items-center mt-1">
                              <Building2 className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"} flex-shrink-0 opacity-70`} />
                              <span className="truncate" title={tender.agency}>{tender.agency}</span>
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="pb-2 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                                {tender.category}
                              </Badge>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/50">
                                {tender.status === 'open' ? (isRTL ? 'مفتوح' : 'Open') : tender.status}
                              </Badge>
                            </div>

                            <div className={`flex items-center text-sm ${daysRemaining <= 5 ? 'text-red-600 dark:text-red-400' : daysRemaining <= 15 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
                              <Clock className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"} flex-shrink-0`} />
                              <span>
                                {isRTL 
                                  ? `الموعد النهائي: متبقي ${daysRemaining} يوم`
                                  : `Deadline: ${daysRemaining} days remaining`}
                              </span>
                            </div>
                          </CardContent>

                          <CardFooter className="border-t pt-3">
                            <Button 
                              className="w-full bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                              onClick={() => setLocation(`/tenders/${tender.id}`)}
                            >
                              {isRTL ? "عرض التفاصيل" : "View Details"}
                            </Button>
                          </CardFooter>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="py-6 text-center">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? "لا توجد مناقصات موصى بها حتى الآن" : "No recommended tenders yet"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                      {isRTL 
                        ? "قم بتحديث ملف شركتك وأضف المزيد من المعلومات للحصول على توصيات أفضل للمناقصات"
                        : "Update your company profile and add more information to get better tender recommendations"}
                    </p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => setLocation("/profile")}
                      >
                        {isRTL ? "تحديث الملف التعريفي" : "Update Profile"}
                      </Button>
                      <Button 
                        onClick={() => refreshMutation.mutate()}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        {isRTL ? "تحديث المناقصات" : "Refresh Tenders"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Active Applications Tab */}
            <TabsContent value="active" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isRTL ? "طلباتي النشطة" : "My Active Applications"}
                </h3>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/applications")}
                  className="text-primary hover:bg-primary/5"
                >
                  {isRTL ? "عرض الكل" : "View All"}
                  {isRTL ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
              
              {applicationsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <div className="w-3/4">
                            <Skeleton className="h-5 w-full mb-2" />
                            <Skeleton className="h-4 w-2/3 mb-2" />
                            <div className="flex gap-2 mt-2">
                              <Skeleton className="h-6 w-16" />
                              <Skeleton className="h-6 w-16" />
                            </div>
                          </div>
                          <Skeleton className="h-10 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : applications.filter(app => 
                app.status === 'pending' || app.status === 'submitted' || app.status === 'in_review'
              ).length > 0 ? (
                <div className="space-y-3">
                  {applications
                    .filter(app => app.status === 'pending' || app.status === 'submitted' || app.status === 'in_review')
                    .slice(0, 3)
                    .map((app) => {
                      const tender = app.tender || tenders.find(t => t.id === app.tenderId) || {
                        title: isRTL ? "مناقصة غير معروفة" : "Unknown Tender",
                        agency: isRTL ? "جهة غير معروفة" : "Unknown Agency",
                        bidNumber: "N/A"
                      };
                      
                      // Status badge styling
                      let statusBadge;
                      switch(app.status) {
                        case 'pending':
                          statusBadge = (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/50">
                              {isRTL ? "قيد الانتظار" : "Pending"}
                            </Badge>
                          );
                          break;
                        case 'submitted':
                          statusBadge = (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                              {isRTL ? "تم التقديم" : "Submitted"}
                            </Badge>
                          );
                          break;
                        case 'in_review':
                          statusBadge = (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800/50">
                              {isRTL ? "قيد المراجعة" : "In Review"}
                            </Badge>
                          );
                          break;
                        default:
                          statusBadge = (
                            <Badge variant="outline">
                              {app.status}
                            </Badge>
                          );
                      }
                      
                      // Format submitted date if available
                      const submittedDate = app.submittedAt 
                        ? formatDistance(new Date(app.submittedAt), new Date(), { 
                            addSuffix: true, 
                            locale: dateLocale 
                          }) 
                        : null;
                      
                      return (
                        <Card key={app.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                              <div className="space-y-1">
                                <h4 className="font-medium line-clamp-1" title={tender.title}>
                                  {tender.title}
                                </h4>
                                <p className="text-sm text-muted-foreground flex items-center">
                                  <Building2 className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"} inline opacity-70`} />
                                  <span className="line-clamp-1" title={tender.agency}>{tender.agency}</span>
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {statusBadge}
                                  
                                  {app.submittedAt && (
                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
                                      <Clock className="h-3 w-3 mr-1 inline" />
                                      {submittedDate}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Button 
                                className="self-end sm:self-center whitespace-nowrap"
                                onClick={() => setLocation(`/applications/${app.id}`)}
                              >
                                {isRTL ? "عرض الطلب" : "View Application"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card className="border-dashed bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="py-6 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? "لا توجد طلبات نشطة" : "No active applications"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                      {isRTL 
                        ? "ابدأ بالتقديم على المناقصات المناسبة لشركتك للحصول على فرص عمل جديدة"
                        : "Start applying to tenders that match your company profile to get new business opportunities"}
                    </p>
                    <div className="mt-4">
                      <Button 
                        onClick={() => setLocation("/tenders")}
                      >
                        {isRTL ? "استكشاف المناقصات" : "Explore Tenders"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Upcoming Deadlines Tab */}
            <TabsContent value="upcoming" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {isRTL ? "المواعيد النهائية القادمة" : "Upcoming Deadlines"}
                </h3>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/applications")}
                  className="text-primary hover:bg-primary/5"
                >
                  {isRTL ? "عرض الكل" : "View All"}
                  {isRTL ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              </div>
              
              {applicationsLoading || tendersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-2" />
                        <div className="flex gap-2 mt-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : upcomingDeadlines.length > 0 ? (
                <div className="space-y-3">
                  {upcomingDeadlines.map((app) => {
                    const tender = tenders.find(t => t.id === app.tenderId);
                    if (!tender) return null;
                    
                    const daysRemaining = getDaysRemaining(tender.deadline);
                    let urgencyClassName = "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/50";
                    
                    if (daysRemaining <= 3) {
                      urgencyClassName = "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/50";
                    } else if (daysRemaining <= 5) {
                      urgencyClassName = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50";
                    }
                    
                    return (
                      <Card key={app.id} className="hover:shadow-sm transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h4 className="font-medium line-clamp-1" title={tender.title}>
                              {tender.title}
                            </h4>
                            <p className="text-sm text-muted-foreground flex items-center">
                              <Building2 className={`h-3 w-3 ${isRTL ? "ml-1" : "mr-1"} inline opacity-70`} />
                              <span className="line-clamp-1" title={tender.agency}>{tender.agency}</span>
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="outline" className={urgencyClassName}>
                                <Clock className="h-3 w-3 mr-1 inline" />
                                {isRTL 
                                  ? `متبقي ${daysRemaining} يوم`
                                  : `${daysRemaining} days remaining`}
                              </Badge>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/50">
                                {isRTL ? "الموعد النهائي" : "Deadline"}: {new Date(tender.deadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                              </Badge>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <Button 
                                variant="outline" 
                                className="text-primary hover:bg-primary/5"
                                onClick={() => setLocation(`/applications/${app.id}`)}
                              >
                                {isRTL ? "عرض التفاصيل" : "View Details"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed bg-gray-50 dark:bg-gray-800/50">
                  <CardContent className="py-6 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {isRTL ? "لا توجد مواعيد نهائية قريبة" : "No upcoming deadlines"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                      {isRTL 
                        ? "جميع طلباتك النشطة لديها مواعيد نهائية تتجاوز 7 أيام من الآن"
                        : "All your active applications have deadlines more than 7 days from now"}
                    </p>
                    <div className="mt-4">
                      <Button 
                        variant="outline"
                        onClick={() => setLocation("/applications")}
                      >
                        {isRTL ? "عرض جميع الطلبات" : "View All Applications"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Analytics preview */}
          <Card className="bg-primary-50/50 dark:bg-primary-950/20 border-primary-100 dark:border-primary-900/50 hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChartHorizontal className="h-5 w-5 text-primary" />
                {isRTL ? "تحليلات المناقصات" : "Tender Analytics"}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? "احصل على نظرة عامة عن أداء المناقصات وفرص المطابقة" 
                  : "Get an overview of tender performance and matching opportunities"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Win rate card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                <div className="text-primary text-xl font-bold">75%</div>
                <div className="text-sm text-center mt-1 text-gray-600 dark:text-gray-300">
                  {isRTL ? "معدل النجاح في المناقصات" : "Tender Win Rate"}
                </div>
                <TrendingUp className="text-green-500 mt-2 h-4 w-4" />
              </div>
              
              {/* Total applied card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                <div className="text-primary text-xl font-bold">{applications.length}</div>
                <div className="text-sm text-center mt-1 text-gray-600 dark:text-gray-300">
                  {isRTL ? "إجمالي الطلبات المقدمة" : "Total Applications"}
                </div>
                <Users className="text-blue-500 mt-2 h-4 w-4" />
              </div>
              
              {/* Completion rate card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm">
                <div className="text-primary text-xl font-bold">
                  {applications.filter(app => app.status === 'awarded').length}
                </div>
                <div className="text-sm text-center mt-1 text-gray-600 dark:text-gray-300">
                  {isRTL ? "المناقصات الناجحة" : "Successful Tenders"}
                </div>
                <CheckCircle2 className="text-green-500 mt-2 h-4 w-4" />
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-primary-100 dark:border-primary-900/50 pt-3">
              <Button 
                variant="ghost" 
                className="text-primary hover:bg-primary-100/50 hover:text-primary-600 dark:hover:bg-primary-900/20"
                onClick={() => setLocation("/analytics")}
              >
                {isRTL ? "عرض التحليلات الكاملة" : "View Full Analytics"}
                {isRTL ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}
