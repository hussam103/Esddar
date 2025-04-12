import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MatchingScore from "@/components/dashboard/matching-score";
import RecommendedTenders from "@/components/dashboard/recommended-tenders";
import ActiveApplications from "@/components/dashboard/active-applications";
import UpcomingDeadlines from "@/components/dashboard/upcoming-deadlines";
import { InteractiveTutorial } from "@/components/tutorial/interactive-tutorial";
import { Achievements } from "@/components/tutorial/achievements";
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

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
  
  // Show tutorial for first-time users
  useEffect(() => {
    if (user && !user.hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [user]);

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

  // Handle tutorial completion
  const handleTutorialComplete = () => {
    setShowTutorial(false);
  };

  // Toggle achievements display
  const toggleAchievements = () => {
    setShowAchievements(!showAchievements);
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
          {/* Show achievements toggle button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleAchievements}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-white px-4 py-2 rounded-full text-sm font-medium transition hover:opacity-90"
            >
              {showAchievements ? t("Hide Achievements") : t("Show Achievements")}
              {showAchievements ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2V5.7a2.8 2.8 0 0 1 4.4-2.3"/><path d="M18 9a3 3 0 0 1 0 6h-1"/><path d="M6 12a3 3 0 0 1 3-3h1"/><path d="M20 12h2"/><path d="M11.2 16.2a3 3 0 0 1-4.4 4.4"/></svg>
              )}
            </button>
          </div>
          
          {/* Show Achievements panel if toggled */}
          {showAchievements && user && (
            <div className="mb-6">
              <Achievements userId={user.id} />
            </div>
          )}
          
          <MatchingScore 
            loading={profileLoading} 
            userProfile={userProfile} 
            profileCompleteness={user?.profileCompleteness || 0} 
          />
          
          <div className="dashboard-overview">
            <RecommendedTenders 
              loading={recommendedTendersLoading} 
              tenders={recommendedTenders} 
              className="recommended-tenders" 
            />
            
            <ActiveApplications 
              loading={applicationsLoading} 
              applications={applications}
              className="applications-tracking" 
            />
            
            <UpcomingDeadlines 
              loading={applicationsLoading} 
              applications={applications} 
              tenders={tenders} 
            />
          </div>
          
          {/* Profile completion card */}
          {!profileLoading && userProfile && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 profile-completion">
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">
                {t("Complete your profile for better matches")}
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                {t("A complete profile helps us match you with the most relevant tenders")}
              </p>
            </div>
          )}
        </div>
      </main>
      
      {/* Tutorial overlay */}
      {showTutorial && user && (
        <InteractiveTutorial
          tutorialKey="dashboard"
          autoStart={true}
          onComplete={handleTutorialComplete}
        />
      )}
    </div>
  );
}
