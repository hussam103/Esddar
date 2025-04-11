import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save } from "lucide-react";

const profileFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().min(1, "Please select an industry"),
  description: z.string().optional(),
  services: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/settings"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={language === "ar" ? "الإعدادات" : "Settings"} 
          subtitle={language === "ar" ? "إدارة ملف الشركة والتفضيلات" : "Manage company profile and preferences"}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">
                {language === "ar" ? "ملف الشركة" : "Company Profile"}
              </TabsTrigger>
              <TabsTrigger value="notifications">
                {language === "ar" ? "الإشعارات" : "Notifications"}
              </TabsTrigger>
              <TabsTrigger value="account">
                {language === "ar" ? "الحساب" : "Account"}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {language === "ar" ? "ملف الشركة" : "Company Profile"}
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
                                <SelectItem value="IT Services">خدمات تكنولوجيا المعلومات</SelectItem>
                                <SelectItem value="Construction">البناء والإنشاءات</SelectItem>
                                <SelectItem value="Healthcare">الرعاية الصحية</SelectItem>
                                <SelectItem value="Education">التعليم</SelectItem>
                                <SelectItem value="Consulting">الاستشارات</SelectItem>
                                <SelectItem value="Manufacturing">التصنيع</SelectItem>
                                <SelectItem value="Finance">التمويل والمالية</SelectItem>
                                <SelectItem value="Retail">تجارة التجزئة</SelectItem>
                                <SelectItem value="Transportation">النقل والمواصلات</SelectItem>
                                <SelectItem value="Energy">الطاقة</SelectItem>
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
            
            <TabsContent value="notifications">
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
            
            <TabsContent value="account">
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
                <CardFooter className="flex justify-between">
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    {language === "ar" ? "حذف الحساب" : "Delete Account"}
                  </Button>
                  <Button>
                    {language === "ar" ? "تحديث الحساب" : "Update Account"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
