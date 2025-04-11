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

// Define a custom Application type that matches what components expect
type ApplicationWithUndefinedDate = {
  id: number;
  tenderId: number;
  status: string;
  submittedAt?: Date;
  tender?: {
    title: string;
    agency: string;
    bidNumber: string;
  };
  userId: number;
  proposalContent?: string;
  documents?: unknown;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch tenders
  const { data: tenders = [], isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/user-profile"],
  });

  // Fetch applications
  const { data: fetchedApplications = [], isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ["/api/applications"],
  });

  // Transform null submittedAt to undefined to match the expected type
  const applications: ApplicationWithUndefinedDate[] = fetchedApplications.map(app => ({
    ...app,
    submittedAt: app.submittedAt || undefined,
    proposalContent: app.proposalContent || undefined
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
          
          <RecommendedTenders loading={tendersLoading} tenders={tenders} />
          
          <ActiveApplications loading={applicationsLoading} applications={applications} />
          
          <UpcomingDeadlines loading={applicationsLoading} applications={applications} tenders={tenders} />
        </div>
      </main>
    </div>
  );
}
