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
              <TabsTrigger value="profile">Company Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Company Profile</CardTitle>
                  <CardDescription>
                    Update your company information to improve tender matching
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
                            <FormLabel>Company Name</FormLabel>
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
                            <FormLabel>Industry</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your industry" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="IT Services">IT Services</SelectItem>
                                <SelectItem value="Construction">Construction</SelectItem>
                                <SelectItem value="Healthcare">Healthcare</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Consulting">Consulting</SelectItem>
                                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                                <SelectItem value="Finance">Finance</SelectItem>
                                <SelectItem value="Retail">Retail</SelectItem>
                                <SelectItem value="Transportation">Transportation</SelectItem>
                                <SelectItem value="Energy">Energy</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              This helps us match you with relevant tenders
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
                            <FormLabel>Company Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Briefly describe your company and its capabilities" 
                                className="min-h-[120px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              This information will be used to improve AI matching
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div>
                        <h3 className="text-sm font-medium mb-3">Profile Completeness</h3>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-primary rounded-full" 
                            style={{ width: `${user?.profileCompleteness || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          {user?.profileCompleteness || 0}% complete - Fill in more details to improve tender matching
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
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
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
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose when and how you'd like to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Email Notifications</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">New Tender Matches</p>
                          <p className="text-sm text-gray-500">Receive notifications when new matching tenders are found</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Tender Deadlines</p>
                          <p className="text-sm text-gray-500">Get reminders for upcoming tender deadlines</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Application Status Updates</p>
                          <p className="text-sm text-gray-500">Be notified when your application status changes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Digest Summary</p>
                          <p className="text-sm text-gray-500">Weekly summary of all tender activity</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">In-App Notifications</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">All Notifications</p>
                          <p className="text-sm text-gray-500">Enable or disable all in-app notifications</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Sound Alerts</p>
                          <p className="text-sm text-gray-500">Play sound when notifications arrive</p>
                        </div>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Notification Settings</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account information and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Account Information</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Username</label>
                          <Input value={user?.username} disabled className="mt-1" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Email Address</label>
                          <Input placeholder="Add email address" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Password</h3>
                    <Separator className="mb-4" />
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Current Password</label>
                          <Input type="password" placeholder="Enter current password" className="mt-1" />
                        </div>
                        
                        <div />
                        
                        <div>
                          <label className="text-sm font-medium">New Password</label>
                          <Input type="password" placeholder="Enter new password" className="mt-1" />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium">Confirm New Password</label>
                          <Input type="password" placeholder="Confirm new password" className="mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    Delete Account
                  </Button>
                  <Button>Update Account</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
