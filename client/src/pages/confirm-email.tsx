import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, AlertCircle, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

const ConfirmEmail = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get token from URL
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setError(t("No confirmation token provided. Please check your email link."));
          return;
        }

        const response = await apiRequest("GET", `/api/confirm-email?token=${token}`);
        
        if (response.ok) {
          setStatus("success");
          toast({
            title: t("Email Verified"),
            description: t("Your email has been successfully verified."),
          });
        } else {
          const data = await response.json();
          setStatus("error");
          setError(data.error || t("Failed to verify your email."));
          toast({
            title: t("Verification Failed"),
            description: data.error || t("Failed to verify your email."),
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error confirming email:", error);
        setStatus("error");
        setError(t("An error occurred while verifying your email."));
        toast({
          title: t("Error"),
          description: t("An error occurred while verifying your email."),
          variant: "destructive",
        });
      }
    };

    confirmEmail();
  }, [toast, t]);

  const redirectToOnboarding = () => {
    setLocation("/onboarding");
  };

  const resendConfirmation = async () => {
    try {
      const response = await apiRequest("POST", "/api/resend-confirmation");
      
      if (response.ok) {
        toast({
          title: t("Email Sent"),
          description: t("A confirmation email has been sent to your email address."),
        });
      } else {
        const data = await response.json();
        toast({
          title: t("Error"),
          description: data.error || t("Failed to resend confirmation email."),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending confirmation:", error);
      toast({
        title: t("Error"),
        description: t("An error occurred while sending the confirmation email."),
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-center text-lg font-medium">
              {t("Verifying your email...")}
            </p>
            <p className="text-center text-muted-foreground mt-2">
              {t("This will only take a moment.")}
            </p>
          </div>
        );
        
      case "success":
        return (
          <motion.div 
            className="flex flex-col items-center justify-center p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                delay: 0.2,
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
            >
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </motion.div>
            
            <motion.h2 
              className="text-xl font-semibold text-center mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {t("Email Successfully Verified!")}
            </motion.h2>
            
            <motion.p 
              className="text-center text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {t("Your email has been successfully verified. You can now continue with the onboarding process.")}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" onClick={redirectToOnboarding}>
                {t("Continue to Onboarding")}
              </Button>
            </motion.div>
          </motion.div>
        );
        
      case "error":
        return (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-4">
              <AlertCircle className="h-12 w-12 text-red-600" />
            </div>
            
            <h2 className="text-xl font-semibold text-center mb-2 text-red-700 dark:text-red-400">
              {t("Email Verification Failed")}
            </h2>
            
            {error && (
              <p className="text-center text-red-600 dark:text-red-400 mb-4">
                {error}
              </p>
            )}
            
            <p className="text-center text-muted-foreground mb-6">
              {t("Please try again or request a new verification email.")}
            </p>
            
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button variant="outline" onClick={resendConfirmation}>
                {t("Resend Verification Email")}
              </Button>
              
              <Button variant="ghost" onClick={redirectToOnboarding}>
                {t("Return to Onboarding")}
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-b from-background to-background/90 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("Email Verification")}</CardTitle>
          <CardDescription>{t("Verify your email address to continue")}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {renderContent()}
        </CardContent>
        
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p className="text-center">
            {t("Having trouble? Contact our support team for assistance.")}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConfirmEmail;