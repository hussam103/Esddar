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

import { Loader2, Save } from "lucide-react";
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
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        {language === "ar" ? "الملف الشخصي" : "Profile"}
      </h1>

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
                  {language === "ar" ? "المستندات المُحملة" : "Uploaded Documents"}
                </CardTitle>
                <CardDescription>
                  {language === "ar"
                    ? "مستندات الشركة التي تم تحميلها إلى النظام"
                    : "Company documents that have been uploaded to the system"}
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
                      ? "لم يتم تحميل أي مستندات بعد"
                      : "No documents uploaded yet"}
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{language === "ar" ? "وصف الشركة" : "Company Description"}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={language === "ar" 
                              ? "صف شركتك وقدراتها بإيجاز" 
                              : "Briefly describe your company and its capabilities"
                            } 
                            className="min-h-[120px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {language === "ar"
                            ? "سيتم استخدام هذه المعلومات لتحسين المطابقة بالذكاء الاصطناعي"
                            : "This information will be used to improve AI matching"
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
                  : "Choose when and how you want to receive notifications"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">
                  {language === "ar" ? "إشعارات البريد الإلكتروني" : "Email Notifications"}
                </h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "مناقصات جديدة متطابقة" : "New Matching Tenders"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "استلام إشعارات عند العثور على مناقصات جديدة متطابقة" 
                          : "Receive notifications when new matching tenders are found"
                        }
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "مواعيد المناقصات" : "Tender Deadlines"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "الحصول على تذكيرات للمواعيد النهائية القادمة" 
                          : "Get reminders for upcoming deadlines"
                        }
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "تحديثات حالة الطلب" : "Application Status Updates"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "تلقي إشعار عند تغيير حالة طلبك" 
                          : "Get notified when your application status changes"
                        }
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "ملخص دوري" : "Periodic Summary"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "ملخص أسبوعي لجميع نشاطات المناقصات" 
                          : "Weekly summary of all tender activities"
                        }
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">
                  {language === "ar" ? "إشعارات التطبيق" : "App Notifications"}
                </h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "جميع الإشعارات" : "All Notifications"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "تفعيل أو تعطيل جميع إشعارات التطبيق" 
                          : "Enable or disable all app notifications"
                        }
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {language === "ar" ? "تنبيهات صوتية" : "Sound Alerts"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {language === "ar" 
                          ? "تشغيل صوت عند وصول الإشعارات" 
                          : "Play sound when notifications arrive"
                        }
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                {language === "ar" ? "حفظ إعدادات الإشعارات" : "Save Notification Settings"}
              </Button>
            </CardFooter>
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
                  ? "إدارة معلومات حسابك والأمان"
                  : "Manage your account information and security"
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">
                  {language === "ar" ? "معلومات الحساب" : "Account Information"}
                </h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        {language === "ar" ? "اسم المستخدم" : "Username"}
                      </label>
                      <Input value={user?.username} disabled className="mt-1" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">
                        {language === "ar" ? "البريد الإلكتروني" : "Email"}
                      </label>
                      <Input 
                        placeholder={language === "ar" ? "أضف البريد الإلكتروني" : "Add your email"} 
                        className="mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-3">
                  {language === "ar" ? "كلمة المرور" : "Password"}
                </h3>
                <Separator className="mb-4" />
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">
                        {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
                      </label>
                      <Input 
                        type="password" 
                        placeholder={language === "ar" ? "أدخل كلمة المرور الحالية" : "Enter current password"} 
                        className="mt-1" 
                      />
                    </div>
                    
                    <div />
                    
                    <div>
                      <label className="text-sm font-medium">
                        {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                      </label>
                      <Input 
                        type="password" 
                        placeholder={language === "ar" ? "أدخل كلمة المرور الجديدة" : "Enter new password"} 
                        className="mt-1" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">
                        {language === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm New Password"}
                      </label>
                      <Input 
                        type="password" 
                        placeholder={language === "ar" ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"} 
                        className="mt-1" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>
                {language === "ar" ? "حفظ إعدادات الحساب" : "Save Account Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {language === "ar" ? "تفضيلات المستخدم" : "User Preferences"}
              </CardTitle>
              <CardDescription>
                {language === "ar"
                  ? "قم بتخصيص إعدادات حسابك"
                  : "Customize your account settings"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">
                    {language === "ar" ? "اللغة" : "Language"}
                  </h3>
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <Button
                      variant={language === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => window.location.reload()}
                      disabled={language === "en"}
                    >
                      English
                    </Button>
                    <Button
                      variant={language === "ar" ? "default" : "outline"}
                      size="sm"
                      onClick={() => window.location.reload()}
                      disabled={language === "ar"}
                    >
                      العربية
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;