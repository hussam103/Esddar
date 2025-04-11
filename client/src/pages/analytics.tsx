import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, AlertTriangle } from "lucide-react";
import { formatSAR } from "@/components/ui/currency";
import { useLanguage } from "@/hooks/use-language";
import { SARIcon } from "@/components/ui/sar-icon";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AnalyticsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language } = useLanguage();

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user-profile"],
  });

  // Sample data for demonstration
  const applicationsByStatus = [
    { name: 'Submitted', value: applications.filter(app => app.status === 'submitted').length },
    { name: 'Under Review', value: applications.filter(app => app.status === 'under_review').length },
    { name: 'Shortlisted', value: applications.filter(app => app.status === 'shortlisted').length },
    { name: 'Accepted', value: 1 },
    { name: 'Declined', value: applications.filter(app => app.status === 'declined').length },
  ];

  const tendersByCategory = [
    { category: 'IT Services', count: 12 },
    { category: 'Consulting', count: 8 },
    { category: 'Security', count: 6 },
    { category: 'Cloud Services', count: 5 },
    { category: 'Networking', count: 4 },
  ];

  const monthlyData = [
    { month: 'Jan', applications: 2, awards: 0 },
    { month: 'Feb', applications: 3, awards: 1 },
    { month: 'Mar', applications: 4, awards: 0 },
    { month: 'Apr', applications: 3, awards: 1 },
    { month: 'May', applications: 5, awards: 2 },
    { month: 'Jun', applications: 6, awards: 1 },
  ];

  const isLoading = applicationsLoading || profileLoading;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/analytics"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Analytics" 
          subtitle="Performance insights and statistics"
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-1/2 mb-1" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{userProfile?.successRate || 0}%</span>
                    <span className="ml-2 text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      8% increase
                    </span>
                  </div>
                  <Progress value={userProfile?.successRate || 0} className="h-2 mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Tenders Found</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{userProfile?.tendersFound || 0}</span>
                    <span className="ml-2 text-xs text-gray-500">this month</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Based on your company profile
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Proposals Submitted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{userProfile?.proposalsSubmitted || 0}</span>
                    <span className="ml-2 text-xs text-gray-500">total</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {applications.length} active applications
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="applications">Applications</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Performance</CardTitle>
                  <CardDescription>
                    Monthly applications and awards over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="applications" fill="hsl(var(--primary))" name="Applications" />
                      <Bar dataKey="awards" fill="hsl(var(--chart-2))" name="Awards" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Application Status</CardTitle>
                    <CardDescription>
                      Status distribution of your applications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={applicationsByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label
                        >
                          {applicationsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} applications`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Highlights</CardTitle>
                    <CardDescription>
                      Key metrics and accomplishments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="bg-primary/10 p-2 rounded-full mr-3">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Increasing Success Rate</h3>
                          <p className="text-sm text-gray-500">Your success rate has increased by 8% compared to last quarter.</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <Award className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Highest Value Contract</h3>
                          <p className="text-sm text-gray-500">
                            Your largest awarded contract was {formatSAR(250000, false, language === 'ar' ? 'ar-SA' : 'en-US')} for IT Infrastructure.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Opportunity</h3>
                          <p className="text-sm text-gray-500">Consider applying for more Cloud Services tenders - they have your highest success rate.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="applications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Application Outcomes</CardTitle>
                  <CardDescription>
                    Detailed view of your application results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 border-b">
                          <th className="px-4 py-3">Tender Title</th>
                          <th className="px-4 py-3">Agency</th>
                          <th className="px-4 py-3">Value</th>
                          <th className="px-4 py-3">Submitted Date</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {applications.map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium">{app.tender?.title}</td>
                            <td className="px-4 py-3 text-gray-600">{app.tender?.agency}</td>
                            <td className="px-4 py-3 text-gray-600">
                              <div className="flex items-center">
                                <SARIcon className="h-3 w-3 text-gray-600 mr-1" />
                                {formatSAR(Number(app.tender?.valueMin || 0), false, language === 'ar' ? 'ar-SA' : 'en-US')} - {formatSAR(Number(app.tender?.valueMax || 0), false, language === 'ar' ? 'ar-SA' : 'en-US')}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {app.submittedAt 
                                ? new Date(app.submittedAt).toLocaleDateString() 
                                : "Draft"}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`
                                px-2 py-1 rounded-full text-xs font-medium
                                ${app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : 
                                  app.status === 'under_review' ? 'bg-amber-100 text-amber-800' :
                                  app.status === 'declined' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'}
                              `}>
                                {app.status.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tender Categories</CardTitle>
                  <CardDescription>
                    Distribution of tenders by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tendersByCategory}
                      layout="vertical"
                      margin={{ top: 20, right: 30, left: 70, bottom: 5 }}
                    >
                      <XAxis type="number" />
                      <YAxis dataKey="category" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Tenders" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Success Rates</CardTitle>
                  <CardDescription>
                    Your performance across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">IT Services</span>
                        <span className="text-sm text-gray-500">40%</span>
                      </div>
                      <Progress value={40} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Cloud Services</span>
                        <span className="text-sm text-gray-500">65%</span>
                      </div>
                      <Progress value={65} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Security</span>
                        <span className="text-sm text-gray-500">25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Consulting</span>
                        <span className="text-sm text-gray-500">30%</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Networking</span>
                        <span className="text-sm text-gray-500">35%</span>
                      </div>
                      <Progress value={35} className="h-2" />
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
}
