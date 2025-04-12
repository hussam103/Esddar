import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Redirect } from 'wouter';
import AdminLayout from '@/components/layout/admin-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, PieChart } from '@/components/ui/charts';
import { Loader2, RefreshCw, AlertTriangle, BarChart3, Users, FileText, Database, Clock } from 'lucide-react';

// Simple bar chart component
const SimpleBarChart = ({ data }: { data: any[] }) => {
  return (
    <div className="w-full h-64">
      <div className="flex justify-between items-end h-full">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-10 bg-primary rounded-t-md" 
              style={{ height: `${(item.value / Math.max(...data.map(d => d.value))) * 100}%`, minHeight: '10px' }}
            ></div>
            <div className="mt-2 text-xs font-medium">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('week');
  
  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/statistics'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });
  
  const { data: ragStats, isLoading: ragLoading } = useQuery({
    queryKey: ['/api/admin/rag-statistics'],
    refetchInterval: 300000 // Refresh every 5 minutes
  });
  
  // Return to login if not logged in or not admin
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 text-center">
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t('Admin Access Required')}</h1>
        <p>{t('You do not have permission to access this page.')}</p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          {t('Go Back')}
        </Button>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Admin Dashboard')}</h1>
            <p className="text-muted-foreground">{t('System overview and statistics')}</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-2 h-4 w-4" />
              {t('Last Updated')}: {new Date().toLocaleTimeString()}
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('Refresh')}
            </Button>
          </div>
        </div>
        
        {/* System Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Total Tenders')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : statistics?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('From all sources')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Registered Users')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : statistics?.users || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('Active accounts')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Tender Applications')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : statistics?.applications || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('Total submissions')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Vector Embeddings')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {ragLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : ragStats?.vectorRecords || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('Tender & profile vectors')}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Time Range Tabs */}
        <Tabs defaultValue="week" className="mb-8" onValueChange={(value) => setTimeRange(value)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="day">{t('Day')}</TabsTrigger>
            <TabsTrigger value="week">{t('Week')}</TabsTrigger>
            <TabsTrigger value="month">{t('Month')}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tenders by Source */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t('Tenders by Source')}</CardTitle>
              <CardDescription>
                {t('Distribution of tenders across different data sources')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : statistics?.bySource && statistics.bySource.length > 0 ? (
                <SimpleBarChart data={statistics.bySource} />
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  <p>{t('No data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Tenders by Status */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t('Tenders by Status')}</CardTitle>
              <CardDescription>
                {t('Current status distribution of all tenders')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : statistics?.byStatus && statistics.byStatus.length > 0 ? (
                <SimpleBarChart data={statistics.byStatus} />
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  <p>{t('No data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* RAG Vectorization Status */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t('RAG Vectorization Status')}</CardTitle>
              <CardDescription>
                {t('Status of tender and profile vectorization for RAG matching')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ragLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ragStats?.vectorization ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t('Total Tenders')}</span>
                    <span className="font-medium">{ragStats.vectorization.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('Processed')}</span>
                    <Badge variant="success">{ragStats.vectorization.processed}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('Pending')}</span>
                    <Badge variant="secondary">{ragStats.vectorization.pending}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{t('Failed')}</span>
                    <Badge variant="destructive">{ragStats.vectorization.failed}</Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full mt-6">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.round((ragStats.vectorization.processed / ragStats.vectorization.total) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    {Math.round((ragStats.vectorization.processed / ragStats.vectorization.total) * 100)}% {t('Complete')}
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  <p>{t('No data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Matching Scores Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>{t('Matching Scores Distribution')}</CardTitle>
              <CardDescription>
                {t('Distribution of tender matching confidence scores')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ragLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : ragStats?.matching && ragStats.matching.length > 0 ? (
                <SimpleBarChart data={ragStats.matching} />
              ) : (
                <div className="flex justify-center items-center h-64 text-muted-foreground">
                  <p>{t('No data available')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* System Alerts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('System Alerts')}</CardTitle>
            <CardDescription>
              {t('Important notifications requiring attention')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('Etimad Scraping Warning')}</AlertTitle>
                <AlertDescription>
                  {t('The last automatic scraping task encountered validation errors. Check the scrape logs for details.')}
                </AlertDescription>
              </Alert>
              
              <Alert>
                <RefreshCw className="h-4 w-4" />
                <AlertTitle>{t('Scheduled Maintenance')}</AlertTitle>
                <AlertDescription>
                  {t('System maintenance scheduled for April 15, 2025 at 02:00 AM. Expected downtime: 30 minutes.')}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Button className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => window.location.href = '/admin/scrape-logs'}>
            <Database className="h-6 w-6" />
            <span>{t('View Scrape Logs')}</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
            <Users className="h-6 w-6" />
            <span>{t('Manage Users')}</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
            <FileText className="h-6 w-6" />
            <span>{t('View Reports')}</span>
          </Button>
          
          <Button className="h-24 flex flex-col items-center justify-center gap-2" variant="outline">
            <BarChart3 className="h-6 w-6" />
            <span>{t('System Analytics')}</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}