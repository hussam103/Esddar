import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import TenderCard from '../tenders/tender-card';
import { useLanguage } from '@/hooks/use-language';

// Helper type for string input fields that will be converted to arrays
type StringOrArray = string | string[];

// Define the search form schema
const searchFormSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  companyDescription: z.string().min(10, 'Please provide a more detailed company description'),
  specialization: z.string().optional(),
  activities: z.union([
    z.string().transform((val) => 
      val.split(',').map(item => item.trim()).filter(item => item !== '')
    ),
    z.array(z.string())
  ]),
  sectors: z.union([
    z.string().transform((val) => 
      val.split(',').map(item => item.trim()).filter(item => item !== '')
    ),
    z.array(z.string())
  ]),
  limit: z.number().min(1).max(100).default(20)
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export default function CompanyProfileSearch() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      companyName: '',
      companyDescription: '',
      specialization: '',
      activities: [],
      sectors: [],
      limit: 20
    }
  });

  const searchMutation = useMutation({
    mutationFn: async (data: SearchFormValues) => {
      const response = await apiRequest('POST', '/api/search-tenders-with-profile', data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setSearchResults(data.results || []);
        toast({
          title: t('Search completed successfully'),
          description: t(`Found ${data.results?.length || 0} matching tenders`),
        });
      } else {
        toast({
          title: t('Search failed'),
          description: data.message || t('Failed to search tenders'),
          variant: 'destructive'
        });
      }
      setHasSearched(true);
    },
    onError: (error: any) => {
      toast({
        title: t('Search failed'),
        description: error?.message || t('Failed to search tenders'),
        variant: 'destructive'
      });
      setHasSearched(true);
    }
  });

  function onSubmit(data: SearchFormValues) {
    searchMutation.mutate(data);
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('Search Tenders by Company Profile')}</CardTitle>
          <CardDescription>
            {t('Enter your company details to find matching government tenders')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Company Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="companyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Company Description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder={t('Describe your company, its capabilities, and areas of expertise...')}
                        className="min-h-24"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Provide a detailed description for better tender matching')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Specialization')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('e.g. Software Development')} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Activities')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder={t('e.g. Web Development, Mobile Apps, Consulting')}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('Separate with commas')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="sectors"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Sectors')}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder={t('e.g. Technology, Healthcare, Education')}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Separate with commas')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="mt-4 w-full"
                disabled={searchMutation.isPending}
              >
                {searchMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Searching...')}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {t('Search Tenders')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{t('Search Results')}</h2>
            <p className="text-muted-foreground">
              {t('Found')} {searchResults.length} {t('matching tenders')}
            </p>
          </div>
          
          <Separator className="my-4" />
          
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((tender) => (
                <TenderCard
                  key={tender.id}
                  tender={tender}
                  matchScore={parseFloat(tender.matchScore || "0")}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto opacity-20 mb-4" />
              <h3 className="text-xl font-medium">{t('No matching tenders found')}</h3>
              <p className="text-muted-foreground mt-2">
                {t('Try adjusting your company profile to get better matches')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}