import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MatchingScore from "@/components/dashboard/matching-score";
import RecommendedTenders from "@/components/dashboard/recommended-tenders";
import ActiveApplications from "@/components/dashboard/active-applications";
import UpcomingDeadlines from "@/components/dashboard/upcoming-deadlines";
import { Tender } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch tenders
  const { data: tenders = [], isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  // Fetch user profile
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/user-profile"],
  });

  // Fetch applications
  const { data: applications = [], isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications"],
  });

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar mobileMenuOpen={mobileMenuOpen} closeMobileMenu={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          title="Dashboard" 
          subtitle={`Welcome back, ${user?.companyName}`}
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
