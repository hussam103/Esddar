import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
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
          title="الإعدادات" 
          subtitle="إدارة ملف الشركة والتفضيلات"
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList>
              <TabsTrigger value="profile">ملف الشركة</TabsTrigger>
              <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
              <TabsTrigger value="account">الحساب</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>ملف الشركة</CardTitle>
                  <CardDescription>
                    تحديث معلومات شركتك لتحسين مطابقة المناقصات
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
                            <FormLabel>اسم الشركة</FormLabel>
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
                            <FormLabel>الصناعة</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر مجال عملك" />
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
                              هذا يساعدنا على مطابقتك مع المناقصات ذات الصلة
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
                            <FormLabel>وصف الشركة</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="صف شركتك وقدراتها بإيجاز" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              سيتم استخدام هذه المعلومات لتحسين المطابقة بالذكاء الاصطناعي
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <h3 className="text-sm font-medium mb-3">اكتمال الملف الشخصي</h3>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${user?.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {user?.profileCompleteness || 0}% مكتمل - املأ المزيد من التفاصيل لتحسين مطابقة المناقصات
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
                            جاري التحديث...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            حفظ التغييرات
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
                  <CardTitle>تفضيلات الإشعارات</CardTitle>
                  <CardDescription>
                    اختر متى وكيف ترغب في تلقي الإشعارات
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">إشعارات البريد الإلكتروني</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">مناقصات جديدة متطابقة</p>
                          <p className="text-sm text-gray-500">استلام إشعارات عند العثور على مناقصات جديدة متطابقة</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">مواعيد المناقصات</p>
                          <p className="text-sm text-gray-500">الحصول على تذكيرات للمواعيد النهائية القادمة</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">تحديثات حالة الطلب</p>
                          <p className="text-sm text-gray-500">تلقي إشعار عند تغيير حالة طلبك</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">ملخص دوري</p>
                          <p className="text-sm text-gray-500">ملخص أسبوعي لجميع نشاطات المناقصات</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">إشعارات التطبيق</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">جميع الإشعارات</p>
                          <p className="text-sm text-gray-500">تفعيل أو تعطيل جميع إشعارات التطبيق</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">تنبيهات صوتية</p>
                          <p className="text-sm text-gray-500">تشغيل صوت عند وصول الإشعارات</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>حفظ إعدادات الإشعارات</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>إعدادات الحساب</CardTitle>
                  <CardDescription>
                    إدارة معلومات حسابك والأمان
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">معلومات الحساب</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">اسم المستخدم</label>
                          <Input value={user?.username} disabled className="mt-1" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">البريد الإلكتروني</label>
                          <Input placeholder="أضف البريد الإلكتروني" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">كلمة المرور</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">كلمة المرور الحالية</label>
                          <Input type="password" placeholder="أدخل كلمة المرور الحالية" className="mt-1" />
                        </div>
                        
                        <div />
                        
                        <div>
                          <label className="text-sm font-medium">كلمة المرور الجديدة</label>
                          <Input type="password" placeholder="أدخل كلمة المرور الجديدة" className="mt-1" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">تأكيد كلمة المرور الجديدة</label>
                          <Input type="password" placeholder="تأكيد كلمة المرور الجديدة" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    حذف الحساب
                  </Button>
                  <Button>تحديث الحساب</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
