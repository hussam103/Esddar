import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tender, insertApplicationSchema } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calendar, MapPin, Tag, DollarSign, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react";

// Create application schema
const applicationSchema = z.object({
  tenderId: z.number(),
  proposalContent: z.string().min(10, "Proposal content is required"),
  status: z.string().default("draft"),
  documents: z.any().default([]),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

export default function TenderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const tenderId = parseInt(id);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch tender details
  const { data: tender, isLoading } = useQuery<Tender>({
    queryKey: [`/api/tenders/${tenderId}`],
  });

  // Check if tender is saved
  const { data: savedStatus, isLoading: savedStatusLoading } = useQuery<{ isSaved: boolean }>({
    queryKey: [`/api/is-tender-saved/${tenderId}`],
  });

  // Save/unsave tender mutations
  const saveTenderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/save-tender", { tenderId });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/is-tender-saved/${tenderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-tenders"] });
      toast({
        title: "Tender saved",
        description: "The tender has been added to your saved list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save tender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unsaveTenderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/save-tender/${tenderId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/is-tender-saved/${tenderId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/saved-tenders"] });
      toast({
        title: "Tender removed",
        description: "The tender has been removed from your saved list",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove tender",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apply for tender form
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      tenderId,
      proposalContent: "",
      status: "draft",
      documents: [],
    },
  });

  // Create application mutation
  const createApplicationMutation = useMutation({
    mutationFn: async (data: ApplicationFormValues) => {
      const res = await apiRequest("POST", "/api/applications", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully",
      });
      setLocation("/proposals");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle save/unsave
  const handleSaveTender = () => {
    if (savedStatus?.isSaved) {
      unsaveTenderMutation.mutate();
    } else {
      saveTenderMutation.mutate();
    }
  };

  // Handle apply
  const onSubmit = (data: ApplicationFormValues) => {
    createApplicationMutation.mutate({
      ...data,
      status: "submitted",
    });
  };

  // Get days remaining until deadline
  const getDaysRemaining = (deadline: Date): number => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Header 
            title={t("tenderDetails.title")} 
            subtitle={t("tenderDetails.loading")}
            toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <div className="p-4 md:p-6 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          <Header 
            title={t("tenderDetails.notFound")} 
            subtitle={t("tenderDetails.notFoundDesc")}
            toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <Card>
              <CardContent className="pt-6">
                <div className="flex mb-4 gap-2 text-destructive">
                  <AlertCircle className="h-8 w-8" />
                  <h1 className="text-2xl font-bold">{t("tenderDetails.notFound")}</h1>
                </div>
                <p className="mt-4 text-gray-600">
                  {t("tenderDetails.notFoundMessage")}
                </p>
                <Button className="mt-6" onClick={() => setLocation("/tenders")}>
                  {t("tenderDetails.backToTenders")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(tender.deadline);
  const deadlineClass = daysRemaining <= 5 
    ? "text-red-600" 
    : daysRemaining <= 10 
      ? "text-amber-600" 
      : "text-gray-600";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/tenders"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={t("tenderDetails.title")} 
          subtitle={tender.title}
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{tender.title}</h1>
              <p className="text-gray-600">{tender.agency} • Bid #{tender.bidNumber}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleSaveTender}
                disabled={saveTenderMutation.isPending || unsaveTenderMutation.isPending || savedStatusLoading}
              >
                {savedStatusLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : savedStatus?.isSaved ? (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                    Saved
                  </span>
                ) : (
                  <span className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Save Tender
                  </span>
                )}
              </Button>
              <Button onClick={() => form.setValue("status", "submitted")}>Apply Now</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left column - Tender details */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("tenderDetails.overview")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">{t("tenderDetails.deadline")}</p>
                        <p className="font-medium">{formatDate(tender.deadline)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className={`h-5 w-5 mr-2 ${deadlineClass}`} />
                      <div>
                        <p className="text-sm text-gray-500">{t("tenderDetails.timeRemaining")}</p>
                        <p className={`font-medium ${deadlineClass}`}>
                          {daysRemaining} {t("tenderDetails.daysLeft")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">{t("tenderDetails.location")}</p>
                        <p className="font-medium">{tender.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">{t("tenderDetails.category")}</p>
                        <p className="font-medium">{tender.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center col-span-2">
                      <DollarSign className="h-5 w-5 text-primary mr-2" />
                      <div>
                        <p className="text-sm text-gray-500">{t("tenderDetails.value")}</p>
                        <p className="font-medium">
                          ${Number(tender.valueMin).toLocaleString()} - ${Number(tender.valueMax).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">{t("tenderDetails.description")}</h3>
                    <p className="text-gray-700">{tender.description}</p>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">{t("tenderDetails.requirements")}</h3>
                    <ul className="list-disc pl-5 text-gray-700 space-y-1">
                      {tender.requirements?.split(',').map((req, index) => (
                        <li key={index}>{req.trim()}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <h3 className="font-medium">{t("tenderDetails.status")}</h3>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge 
                        className={tender.status === "open" 
                          ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800" 
                          : ""}
                      >
                        {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                      </Badge>
                      
                      {tender.source === 'etimad' && (
                        <Badge className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                          منصة اعتماد
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("tenderDetails.issuingAgency")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary mr-4">
                      <span className="text-lg font-semibold">
                        {tender.agency.split(' ').map(word => word[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-lg">{tender.agency}</p>
                      <p className="text-gray-600 text-sm">{t("tenderDetails.governmentInstitution")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Application */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>{t("tenderDetails.applyForTender")}</CardTitle>
                  <CardDescription>
                    {t("tenderDetails.completeForm")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="details">{t("tenderDetails.tabDetails")}</TabsTrigger>
                      <TabsTrigger value="proposal">{t("tenderDetails.tabProposal")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details" className="space-y-4 pt-4">
                      <div>
                        <h3 className="font-medium mb-2">{t("tenderDetails.deadline")}</h3>
                        <p className={`${deadlineClass} font-medium`}>
                          {formatDate(tender.deadline)} ({daysRemaining} {t("tenderDetails.daysLeft")})
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">{t("tenderDetails.value")}</h3>
                        <p className="font-medium">
                          ${Number(tender.valueMin).toLocaleString()} - ${Number(tender.valueMax).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">{t("tenderDetails.category")}</h3>
                        <p>{tender.category}</p>
                      </div>
                      <div>
                        <h3 className="font-medium mb-2">{t("tenderDetails.bidNumber")}</h3>
                        <p>{tender.bidNumber}</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="proposal" className="pt-4">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="proposalContent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t("tenderDetails.proposalContent")}</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder={t("tenderDetails.proposalPlaceholder")}
                                    className="min-h-[200px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div>
                            <h3 className="text-sm font-medium mb-2">{t("tenderDetails.aiSuggestions")}</h3>
                            <div className="text-sm bg-primary-50 p-3 rounded-md text-primary-700 space-y-2">
                              <p>• {t("tenderDetails.aiSuggestion1")}</p>
                              <p>• {t("tenderDetails.aiSuggestion2")}</p>
                              <p>• {t("tenderDetails.aiSuggestion3")}</p>
                            </div>
                          </div>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setLocation("/tenders")}>
                    {t("tenderDetails.backToTenders")}
                  </Button>
                  
                  {tender.source === 'etimad' ? (
                    // For Etimad tenders, we provide a link to apply on Etimad platform
                    <a 
                      href={`https://tenders.etimad.sa/Tender/OpenTenderDetailsReportForVisitor?tenderIdString=${encodeURIComponent(tender.externalId || '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded bg-gradient-to-l from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 transition-colors duration-150"
                    >
                      تقديم طلب في منصة اعتماد
                    </a>
                  ) : (
                    // For local tenders, use the regular submit application button
                    <Button 
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={createApplicationMutation.isPending}
                    >
                      {createApplicationMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
