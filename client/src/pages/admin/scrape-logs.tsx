import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Terminal, Clock, AlertCircle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from '@/hooks/use-language';
import { Redirect } from 'wouter';
import AdminLayout from '@/components/layout/admin-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Used to format dates according to language
function formatDate(date: string | Date, language: string) {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPp', { locale: language === 'ar' ? ar : undefined });
}

export default function ScrapeLogs() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const {
    data: logs,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/scrape-logs'],
    refetchInterval: 60000 // Refresh every minute
  });
  
  // Manually trigger a new scrape for the Etimad source
  const triggerScrape = async () => {
    try {
      const response = await fetch('/api/admin/scrape/1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: t('Scraping job started'),
          description: t('The scraping job has been initiated. Check back soon for results.'),
          variant: 'default'
        });
        refetch(); // Refresh the logs
      } else {
        toast({
          title: t('Error'),
          description: t('Failed to start scraping job. Please try again.'),
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: t('Error'),
        description: t('An unexpected error occurred. Please try again.'),
        variant: 'destructive'
      });
    }
  };
  
  // Return to login if not logged in or not admin
  if (!user) {
    return <Redirect to="/auth" />;
  }
  
  if (user.role !== 'admin') {
    return (
      <div className="container mx-auto p-8 text-center">
        <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">{t('Admin Access Required')}</h1>
        <p>{t('You do not have permission to access this page.')}</p>
        <Button className="mt-4" onClick={() => window.history.back()}>
          {t('Go Back')}
        </Button>
      </div>
    );
  }
  
  // Filter logs based on search term and status
  const filteredLogs = logs ? logs.filter(log => {
    // Status filter
    if (statusFilter !== 'all' && log.status !== statusFilter) {
      return false;
    }
    
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.source?.name?.toLowerCase().includes(searchLower) ||
        log.status?.toLowerCase().includes(searchLower) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  }) : [];
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('Completed')}</Badge>;
      case 'running':
        return <Badge variant="secondary">{t('Running')}</Badge>;
      case 'failed':
        return <Badge variant="destructive">{t('Failed')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="container p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Scrape Logs')}</h1>
            <p className="text-muted-foreground">{t('Monitor and manage data scraping activities')}</p>
          </div>
          <Button onClick={triggerScrape} className="shrink-0">
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('Trigger Manual Scrape')}
          </Button>
        </div>
        
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Search logs...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={t('Status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('All Statuses')}</SelectItem>
              <SelectItem value="completed">{t('Completed')}</SelectItem>
              <SelectItem value="running">{t('Running')}</SelectItem>
              <SelectItem value="failed">{t('Failed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Total Scrapes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : logs?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Success Rate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  logs && logs.length > 0 ? 
                  `${Math.round((logs.filter(log => log.status === 'completed').length / logs.length) * 100)}%` :
                  '0%'
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Total Tenders Scraped')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  logs?.reduce((total, log) => total + (log.totalTenders || 0), 0) || 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Scraping History')}</CardTitle>
            <CardDescription>
              {t('Detailed logs of all scraping activities')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="w-full py-8 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableCaption>{t('End of scrape logs')}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('ID')}</TableHead>
                      <TableHead>{t('Source')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Start Time')}</TableHead>
                      <TableHead>{t('End Time')}</TableHead>
                      <TableHead>{t('Tenders')}</TableHead>
                      <TableHead>{t('New')}</TableHead>
                      <TableHead>{t('Updated')}</TableHead>
                      <TableHead>{t('Failed')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          {searchTerm || statusFilter !== 'all' ? (
                            <div className="flex flex-col items-center justify-center">
                              <Search className="h-8 w-8 text-muted-foreground mb-2" />
                              <p>{t('No matching scrape logs found')}</p>
                              <Button 
                                variant="outline" 
                                className="mt-2"
                                onClick={() => {
                                  setSearchTerm('');
                                  setStatusFilter('all');
                                }}
                              >
                                {t('Clear filters')}
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <Terminal className="h-8 w-8 text-muted-foreground mb-2" />
                              <p>{t('No scrape logs yet')}</p>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{log.id}</TableCell>
                          <TableCell>{log.source?.name || t('Unknown')}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell dir="ltr">{formatDate(log.startTime, language)}</TableCell>
                          <TableCell dir="ltr">{log.endTime ? formatDate(log.endTime, language) : '-'}</TableCell>
                          <TableCell>{log.totalTenders || 0}</TableCell>
                          <TableCell>{log.newTenders || 0}</TableCell>
                          <TableCell>{log.updatedTenders || 0}</TableCell>
                          <TableCell>{log.failedTenders || 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}