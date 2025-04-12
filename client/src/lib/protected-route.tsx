import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(false);

  useEffect(() => {
    // Skip onboarding check for the onboarding page itself
    if (user && path !== "/onboarding") {
      setIsCheckingOnboarding(true);
      
      apiRequest("GET", "/api/onboarding-status")
        .then(res => res.json())
        .then(data => {
          setOnboardingStatus(data);
          setIsCheckingOnboarding(false);
        })
        .catch(() => {
          setIsCheckingOnboarding(false);
        });
    }
  }, [user, path]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If we're not on the onboarding page and onboarding is not completed,
  // redirect to the onboarding page
  if (
    path !== "/onboarding" &&
    onboardingStatus && 
    !onboardingStatus.completed
  ) {
    return (
      <Route path={path}>
        <Redirect to="/onboarding" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Verify that the user has admin role
  if (user.role !== 'admin') {
    return (
      <Route path={path}>
        <Redirect to="/dashboard" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
