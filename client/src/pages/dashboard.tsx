import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MatchingScore from "@/components/dashboard/matching-score";
import RecommendedTenders from "@/components/dashboard/recommended-tenders";
import ActiveApplications from "@/components/dashboard/active-applications";
import UpcomingDeadlines from "@/components/dashboard/upcoming-deadlines";
import { Tender, UserProfile } from "@shared/schema";

// Don't import the Application type from schema as our components have custom types
// Define the Application type that matches what our components expect
type CustomApplication = {
  id: number;
  tenderId: number;
  status: string;
  submittedAt?: Date;
  userId: number;
  proposalContent?: string;
  documents?: unknown;
  matchScore?: number;
  tender?: {
    title: string;
    agency: string;
    bidNumber: string;
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all tenders (still needed for other components)
  const { data: tenders = [], isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });
  
  // Fetch recommended tenders (top matches)
  const { data: recommendedTenders = [], isLoading: recommendedTendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/recommended-tenders"],
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user-profile"],
  });

  // Fetch applications
  const { data: fetchedApplications = [], isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ["/api/applications"],
  });

  // Transform application data to include tender info
  const applications: CustomApplication[] = fetchedApplications.map(app => ({
    ...app,
    submittedAt: app.submittedAt || undefined,
    proposalContent: app.proposalContent || undefined,
    documents: app.documents || undefined,
    matchScore: app.matchScore || undefined,
    tender: app.tender
  }));

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row" dir={language === "ar" ? "rtl" : "ltr"}>
      <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title={t("nav.dashboard")} 
          subtitle={language === "ar" ? 
            `مرحباً بعودتك، ${user?.companyName}` : 
            `Welcome back, ${user?.companyName}`}
          toggleMobileMenu={toggleMobileMenu}
        />
        
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <MatchingScore 
            loading={profileLoading} 
            userProfile={userProfile} 
            profileCompleteness={user?.profileCompleteness || 0} 
          />
          
          <RecommendedTenders loading={recommendedTendersLoading} tenders={recommendedTenders} />
          
          <ActiveApplications loading={applicationsLoading} applications={applications} />
          
          <UpcomingDeadlines loading={applicationsLoading} applications={applications} tenders={tenders} />
        </div>
      </main>
    </div>
  );
}
