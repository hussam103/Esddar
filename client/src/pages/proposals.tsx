import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronRight, Loader2 } from "lucide-react";

export default function ProposalsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Fetch applications
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Format date for display
  const formatDate = (dateString: string | Date | undefined): string => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "submitted":
        return "default";
      case "draft":
        return "outline";
      case "under_review":
        return "warning";
      case "shortlisted":
        return "success";
      case "declined":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        closeMobileMenu={() => setMobileMenuOpen(false)} 
        activePage="/proposals"
      />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Proposals & Applications" 
          subtitle="Track your submitted proposals and applications"
          toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setLocation("/tenders")}
              className="flex items-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2 mb-4 md:mb-0">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                      <div className="flex items-center">
                        <Skeleton className="h-9 w-20 mr-2" />
                        <Skeleton className="h-9 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="p-0">
                        <div className="p-4 border-b">
                          <h3 className="text-lg font-medium">{application.tender?.title}</h3>
                          <p className="text-gray-600 text-sm">{application.tender?.agency} • Bid #{application.tender?.bidNumber}</p>
                        </div>
                        <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="space-y-1 mb-4 md:mb-0">
                            <div className="flex items-center">
                              <span className="text-gray-500 mr-2">Status:</span>
                              <Badge variant={getStatusVariant(application.status)}>
                                {formatStatus(application.status)}
                              </Badge>
                            </div>
                            <div className="text-gray-500 text-sm">
                              Submitted: {formatDate(application.submittedAt)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Button 
                              variant="outline" 
                              className="mr-2"
                              onClick={() => setLocation(`/tenders/${application.tenderId}`)}
                            >
                              View Tender
                            </Button>
                            <Button 
                              onClick={() => setLocation(`/applications/${application.id}`)}
                              className="flex items-center"
                            >
                              View Details
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg bg-white">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No applications yet</h3>
                  <p className="text-gray-500 mt-2">You haven't submitted any applications yet.</p>
                  <Button 
                    onClick={() => setLocation("/tenders")}
                    className="mt-4"
                  >
                    Browse Tenders
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
