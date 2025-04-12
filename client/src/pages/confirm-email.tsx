import { useEffect, useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "@/hooks/use-language";

const ConfirmEmail = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/confirm-email");
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState("");
  const token = new URLSearchParams(window.location.search).get('token');

  useEffect(() => {
    // If already logged in and email already verified, redirect to dashboard
    if (user && user.emailVerified) {
      setLocation("/dashboard");
      return;
    }

    // If no token is provided, show error
    if (!token) {
      setStatus('error');
      setMessage(t("Invalid or missing confirmation token"));
      return;
    }

    // Call the API to confirm email
    const confirmEmail = async () => {
      try {
        const response = await apiRequest("GET", `/api/confirm-email?token=${token}`);
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(t("Your email has been confirmed successfully!"));
          
          // Show toast notification
          toast({
            title: t("Email Confirmed"),
            description: t("Your email has been confirmed successfully."),
          });
          
          // Redirect after a delay if the user is logged in
          if (user) {
            setTimeout(() => {
              setLocation("/dashboard");
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage(data.error || t("Failed to confirm email"));
          
          toast({
            title: t("Confirmation Failed"),
            description: data.error || t("Failed to confirm your email."),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error confirming email:", error);
        setStatus('error');
        setMessage(t("An error occurred while confirming your email"));
        
        toast({
          title: t("Error"),
          description: t("An error occurred while confirming your email."),
          variant: "destructive",
        });
      }
    };

    confirmEmail();
  }, [token, toast, t, setLocation, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{t("Email Confirmation")}</CardTitle>
          <CardDescription>
            {status === 'loading' ? t("Verifying your email address...") : 
             status === 'success' ? t("Verification complete") : 
             t("Verification failed")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-500 mb-4" />
          )}
          <p className="text-center mb-4">{message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'success' && (
            <Button className="w-full" onClick={() => setLocation("/dashboard")}>
              {t("Proceed to Dashboard")}
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2 w-full">
              <Button className="w-full" variant="outline" onClick={() => setLocation("/auth")}>
                {t("Back to Login")}
              </Button>
              {user && (
                <Button 
                  className="w-full" 
                  onClick={async () => {
                    try {
                      await apiRequest("POST", "/api/resend-confirmation");
                      toast({
                        title: t("Email Sent"),
                        description: t("A new confirmation email has been sent."),
                      });
                    } catch (error) {
                      toast({
                        title: t("Error"),
                        description: t("Failed to resend confirmation email."),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {t("Resend Confirmation Email")}
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmEmail;