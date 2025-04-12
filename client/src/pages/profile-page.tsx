import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { DocumentUpload } from "@/components/profile/document-upload";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

import { Loader2, Save, ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// Form schema
const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  description: z.string().optional(),
  services: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const ProfilePage = () => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("info");
  const [_, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch user profile data
  const { data: profile, isLoading: isProfileLoading } = useQuery<any>({
    queryKey: ["/api/user-profile"],
    enabled: !!user,
  });

  // Fetch user's company documents
  const { data: documents, isLoading: isDocumentsLoading } = useQuery<any[]>({
    queryKey: ["/api/company-documents"],
    enabled: !!user,
  });
  
  // Form setup
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      companyName: user?.companyName || "",
      industry: user?.industry || "",
      description: user?.description || "",
      services: user?.services || [],
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormValues>) => {
      const res = await apiRequest("PUT", "/api/user", data);
      return await res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your company profile has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir={language === "ar" ? "rtl" : "ltr"}>
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/profile"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={language === "ar" ? "الملف الشخصي" : "Profile"} 
          subtitle={language === "ar" ? 
            `إدارة معلومات الشركة والإعدادات` : 
            `Manage company information and settings`}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Tabs
            defaultValue="info"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">
                {language === "ar" ? "معلومات الشركة" : "Company Info"}
              </TabsTrigger>
              <TabsTrigger value="documents">
                {language === "ar" ? "المستندات" : "Documents"}
              </TabsTrigger>
              <TabsTrigger value="edit">
                {language === "ar" ? "تعديل الملف" : "Edit Profile"}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                {language === "ar" ? "الإشعارات" : "Notifications"}
              </TabsTrigger>
              <TabsTrigger value="account">
                {language === "ar" ? "الحساب" : "Account"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "معلومات الشركة" : "Company Information"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "المعلومات الأساسية عن شركتك"
                      : "Basic information about your company"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isProfileLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">
                          {language === "ar" ? "اسم الشركة" : "Company Name"}
                        </h3>
                        <p className="text-base">{user.companyName}</p>
                      </div>

                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">
                          {language === "ar" ? "وصف الشركة" : "Company Description"}
                        </h3>
                        <p className="text-base">
                          {profile?.companyDescription || 
                            (language === "ar" 
                              ? "لم يتم إضافة وصف بعد. قم بتحميل مستندات الشركة للحصول على وصف تلقائي."
                              : "No description added yet. Upload company documents to get an automatic description.")
                          }
                        </p>
                      </div>

                      {profile?.businessType && (
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground mb-1">
                            {language === "ar" ? "نوع العمل" : "Business Type"}
                          </h3>
                          <p className="text-base">{profile.businessType}</p>
                        </div>
                      )}

                      {profile?.companyActivities && profile.companyActivities.length > 0 && (
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground mb-1">
                            {language === "ar" ? "أنشطة الشركة" : "Company Activities"}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(profile.companyActivities) && profile.companyActivities.map((activity: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile?.mainIndustries && profile.mainIndustries.length > 0 && (
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground mb-1">
                            {language === "ar" ? "القطاعات الرئيسية" : "Main Industries"}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(profile.mainIndustries) && profile.mainIndustries.map((industry: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {industry}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile?.specializations && profile.specializations.length > 0 && (
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground mb-1">
                            {language === "ar" ? "التخصصات" : "Specializations"}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(profile.specializations) && profile.specializations.map((specialization: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {specialization}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-1">
                          {language === "ar" ? "إنشاء المستخدم" : "Username"}
                        </h3>
                        <p className="text-base">{user.username}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <div className="grid gap-6">
                <DocumentUpload />

                <Card>
                  <CardHeader>
                    <CardTitle>
                      {language === "ar" ? "ملف الشركة المُحمل" : "Uploaded Company Profile"}
                    </CardTitle>
                    <CardDescription>
                      {language === "ar"
                        ? "ملف تعريف الشركة الذي تم تحميله إلى النظام"
                        : "Company profile document that has been uploaded to the system"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isDocumentsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : documents && documents.length > 0 ? (
                      <div className="space-y-4">
                        {documents.map((doc: any) => (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{doc.fileName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(doc.uploadedAt).toLocaleDateString(
                                    language === "ar" ? "ar-SA" : "en-US"
                                  )}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  doc.status === "completed"
                                    ? "secondary"
                                    : doc.status === "error"
                                    ? "destructive"
                                    : doc.status === "processing"
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {doc.status === "completed"
                                  ? language === "ar"
                                    ? "مكتمل"
                                    : "Completed"
                                  : doc.status === "error"
                                  ? language === "ar"
                                    ? "خطأ"
                                    : "Error"
                                  : doc.status === "processing"
                                  ? language === "ar"
                                    ? "قيد المعالجة"
                                    : "Processing"
                                  : language === "ar"
                                  ? "معلق"
                                  : "Pending"}
                              </Badge>
                            </div>
                            {doc.status === "error" && doc.errorMessage && (
                              <p className="text-sm text-red-500 mt-2">
                                {doc.errorMessage}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        {language === "ar"
                          ? "لم يتم تحميل ملف تعريف الشركة بعد"
                          : "No company profile document uploaded yet"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "تعديل ملف الشركة" : "Edit Company Profile"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar" 
                      ? "تحديث معلومات شركتك لتحسين مطابقة المناقصات"
                      : "Update your company information to improve tender matching"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "ar" ? "اسم الشركة" : "Company Name"}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === "ar" ? "الصناعة" : "Industry"}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={language === "ar" ? "اختر مجال عملك" : "Select your industry"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="IT Services">
                                  {language === "ar" ? "خدمات تكنولوجيا المعلومات" : "IT Services"}
                                </SelectItem>
                                <SelectItem value="Construction">
                                  {language === "ar" ? "البناء والإنشاءات" : "Construction"}
                                </SelectItem>
                                <SelectItem value="Healthcare">
                                  {language === "ar" ? "الرعاية الصحية" : "Healthcare"}
                                </SelectItem>
                                <SelectItem value="Education">
                                  {language === "ar" ? "التعليم" : "Education"}
                                </SelectItem>
                                <SelectItem value="Consulting">
                                  {language === "ar" ? "الاستشارات" : "Consulting"}
                                </SelectItem>
                                <SelectItem value="Manufacturing">
                                  {language === "ar" ? "التصنيع" : "Manufacturing"}
                                </SelectItem>
                                <SelectItem value="Finance">
                                  {language === "ar" ? "التمويل والمالية" : "Finance"}
                                </SelectItem>
                                <SelectItem value="Retail">
                                  {language === "ar" ? "تجارة التجزئة" : "Retail"}
                                </SelectItem>
                                <SelectItem value="Transportation">
                                  {language === "ar" ? "النقل والمواصلات" : "Transportation"}
                                </SelectItem>
                                <SelectItem value="Energy">
                                  {language === "ar" ? "الطاقة" : "Energy"}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {language === "ar" 
                                ? "هذا يساعدنا على مطابقتك مع المناقصات ذات الصلة"
                                : "This helps us match you with relevant tenders"
                              }
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <h3 className="text-sm font-medium mb-3">
                          {language === "ar" ? "اكتمال الملف الشخصي" : "Profile Completion"}
                        </h3>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${user?.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {user?.profileCompleteness || 0}% {language === "ar" 
                            ? "مكتمل - املأ المزيد من التفاصيل لتحسين مطابقة المناقصات"
                            : "complete - Fill in more details to improve tender matching"
                          }
                        </p>
                      </div>

                      <Button 
                        type="submit" 
                        className="flex items-center"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {language === "ar" ? "جاري التحديث..." : "Updating..."}
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="notifications" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "تفضيلات الإشعارات" : "Notification Preferences"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "اختر متى وكيف ترغب في تلقي الإشعارات"
                      : "Choose when and how you want to receive notifications"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-medium">
                          {language === "ar" ? "إشعارات البريد الإلكتروني" : "Email Notifications"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar"
                            ? "استلام إشعارات عبر البريد الإلكتروني"
                            : "Receive notifications via email"}
                        </p>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-medium">
                          {language === "ar" ? "إشعارات المناقصات الجديدة" : "New Tender Notifications"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar"
                            ? "إعلامك عندما تكون هناك مناقصات جديدة مطابقة لملفك الشخصي"
                            : "Notify you when there are new tenders matching your profile"}
                        </p>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h3 className="text-base font-medium">
                          {language === "ar" ? "تذكيرات المواعيد النهائية" : "Deadline Reminders"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {language === "ar"
                            ? "تذكيرك بالمواعيد النهائية القادمة للمناقصات المحفوظة"
                            : "Remind you of upcoming deadlines for saved tenders"}
                        </p>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="account" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "إعدادات الحساب" : "Account Settings"}
                  </CardTitle>
                  <CardDescription>
                    {language === "ar"
                      ? "إدارة حسابك وتغيير كلمة المرور"
                      : "Manage your account and change password"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </h3>
                      <p className="text-base">{user.email}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        {language === "ar" ? "حالة البريد الإلكتروني" : "Email Status"}
                      </h3>
                      <Badge variant={user.emailVerified ? "outline" : "destructive"}>
                        {user.emailVerified 
                          ? (language === "ar" ? "تم التحقق" : "Verified") 
                          : (language === "ar" ? "غير مؤكد" : "Unverified")}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground mb-1">
                        {language === "ar" ? "تاريخ الانضمام" : "Join Date"}
                      </h3>
                      <p className="text-base">{new Date(user.createdAt).toLocaleDateString(
                        language === "ar" ? "ar-SA" : "en-US"
                      )}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-base mb-3">
                        {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
                      </h3>
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="current-password">
                            {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
                          </Label>
                          <Input id="current-password" type="password" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="new-password">
                            {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                          </Label>
                          <Input id="new-password" type="password" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirm-password">
                            {language === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                          </Label>
                          <Input id="confirm-password" type="password" />
                        </div>
                        <Button className="w-full">
                          {language === "ar" ? "تحديث كلمة المرور" : "Update Password"}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-base text-destructive mb-3">
                        {language === "ar" ? "حذف الحساب" : "Delete Account"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {language === "ar"
                          ? "سيؤدي حذف حسابك إلى إزالة جميع بياناتك من نظامنا. هذا الإجراء لا يمكن التراجع عنه."
                          : "Deleting your account will remove all your data from our system. This action cannot be undone."}
                      </p>
                      <Button variant="destructive" className="w-full">
                        {language === "ar" ? "حذف الحساب" : "Delete Account"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;

// Add missing Label component
const Label = ({ htmlFor, children }: { htmlFor: string, children: React.ReactNode }) => (
  <label
    htmlFor={htmlFor}
    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
  >
    {children}
  </label>
);