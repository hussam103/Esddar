import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Step, StepDescription, StepLabel, StepSeparator, StepStatus, Steps } from "@/components/ui/steps";
import { useLanguage } from "@/hooks/use-language";
import { Loader2, Mail, FileText, CreditCard, Package, Check, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { DocumentUpload } from "@/components/profile/document-upload";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

type OnboardingStep = 'email_verification' | 'upload_document' | 'choose_plan' | 'payment' | 'completed';

interface OnboardingStatus {
  completed: boolean;
  currentStep: OnboardingStep;
  emailVerified: boolean;
  documentStatus: {
    documentId: string;
    status: string;
    fileName: string;
    uploadedAt: string;
  } | null;
  hasSubscription: boolean;
  hasTutorial: boolean;
}

const Onboarding = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Step mapping for UI display
  const stepMap: { [key in OnboardingStep]: number } = {
    'email_verification': 0,
    'upload_document': 1,
    'choose_plan': 2,
    'payment': 3,
    'completed': 4
  };

  // Fetch onboarding status
  const fetchOnboardingStatus = async () => {
    try {
      setStatus('loading');
      const response = await apiRequest("GET", "/api/onboarding-status");
      
      if (response.ok) {
        const data = await response.json();
        setOnboardingStatus(data);
        setActiveStep(stepMap[data.currentStep]);
        setStatus('loaded');
      } else {
        setStatus('error');
        toast({
          title: t("Error"),
          description: t("Failed to fetch onboarding status."),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      setStatus('error');
      toast({
        title: t("Error"),
        description: t("An error occurred while fetching your onboarding status."),
        variant: "destructive",
      });
    }
  };

  // Proceed to next step
  const proceedToNextStep = async (currentStep: OnboardingStep, nextStep: OnboardingStep) => {
    try {
      const response = await apiRequest("POST", "/api/onboarding/next-step", {
        currentStep,
        nextStep
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Refresh the onboarding status
          fetchOnboardingStatus();
          
          // Show success message
          toast({
            title: t("Success"),
            description: t("Moved to the next step successfully."),
          });
          
          // If completed, redirect to dashboard after delay
          if (nextStep === 'completed') {
            setTimeout(() => {
              setLocation("/dashboard");
            }, 1500);
          }
        }
      } else {
        const error = await response.json();
        toast({
          title: t("Error"),
          description: error.error || t("Failed to proceed to next step."),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error proceeding to next step:", error);
      toast({
        title: t("Error"),
        description: t("An error occurred while updating your onboarding progress."),
        variant: "destructive",
      });
    }
  };

  // Handle resending email confirmation
  const resendConfirmationEmail = async () => {
    try {
      const response = await apiRequest("POST", "/api/resend-confirmation");
      
      if (response.ok) {
        toast({
          title: t("Email Sent"),
          description: t("A confirmation email has been sent to your email address."),
        });
      } else {
        const error = await response.json();
        toast({
          title: t("Error"),
          description: error.error || t("Failed to resend confirmation email."),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      toast({
        title: t("Error"),
        description: t("An error occurred while sending the confirmation email."),
        variant: "destructive",
      });
    }
  };

  // Load onboarding status when component mounts
  useEffect(() => {
    if (user) {
      fetchOnboardingStatus();
    } else {
      // Redirect to auth if not logged in
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // If user's onboarding is completed, redirect to dashboard
  useEffect(() => {
    if (onboardingStatus?.completed) {
      setLocation("/dashboard");
    }
  }, [onboardingStatus, setLocation]);

  if (status === 'loading' || !onboardingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    const currentStep = onboardingStatus.currentStep;
    
    switch (currentStep) {
      case 'email_verification':
        return (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800">
              {t("Please verify your email address to continue. We've sent a confirmation link to your email.")}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Mail className="h-16 w-16 text-primary" />
              <p className="text-center">
                {t("We've sent a verification email to your registered email address. Please check your inbox and click the confirmation link.")}
              </p>
              
              <Button onClick={resendConfirmationEmail}>
                {t("Resend Confirmation Email")}
              </Button>
            </div>
          </div>
        );
        
      case 'upload_document':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-blue-800">
              {t("Please upload your company profile document to help us match you with relevant tenders.")}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <FileText className="h-16 w-16 text-primary" />
              <p className="text-center">
                {t("Upload your company profile document (PDF format). This will help us identify the best tenders for your business.")}
              </p>
              
              <DocumentUpload 
                onSuccess={() => {
                  fetchOnboardingStatus();
                  toast({
                    title: t("Document Uploaded"),
                    description: t("Your document has been uploaded successfully."),
                  });
                }}
              />
              
              {onboardingStatus.documentStatus && (
                <div className="w-full p-3 border rounded-md bg-green-50 text-green-800">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-medium">{t("Document uploaded")}: </span>
                    <span className="ml-2">{onboardingStatus.documentStatus.fileName}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    {t("Status")}: {onboardingStatus.documentStatus.status}
                  </div>
                </div>
              )}
              
              {onboardingStatus.documentStatus && (
                <Button 
                  className="w-full" 
                  onClick={() => proceedToNextStep('upload_document', 'choose_plan')}
                >
                  {t("Continue to Plan Selection")}
                </Button>
              )}
            </div>
          </div>
        );
        
      case 'choose_plan':
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-md text-purple-800">
              {t("Choose a subscription plan that best fits your business needs.")}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Package className="h-16 w-16 text-primary" />
              <p className="text-center">
                {t("Select a subscription plan to access all features of our platform. Choose the option that best suits your business needs.")}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <Card className="cursor-pointer hover:border-primary transition-all">
                  <CardHeader>
                    <CardTitle>{t("Basic")}</CardTitle>
                    <CardDescription>{t("For small businesses")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">199 ﷼</div>
                    <div className="text-muted-foreground">{t("per month")}</div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Up to 5 tender matches")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Basic analytics")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Email notifications")}
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/subscribe/basic")}
                    >
                      {t("Select Plan")}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="cursor-pointer hover:border-primary transition-all border-primary">
                  <CardHeader className="bg-primary/10">
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full w-fit mb-2">
                      {t("POPULAR")}
                    </div>
                    <CardTitle>{t("Professional")}</CardTitle>
                    <CardDescription>{t("For growing businesses")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">499 ﷼</div>
                    <div className="text-muted-foreground">{t("per month")}</div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Unlimited tender matches")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Advanced analytics")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Priority notifications")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Proposal templates")}
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/subscribe/professional")}
                    >
                      {t("Select Plan")}
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="cursor-pointer hover:border-primary transition-all">
                  <CardHeader>
                    <CardTitle>{t("Enterprise")}</CardTitle>
                    <CardDescription>{t("For large organizations")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">999 ﷼</div>
                    <div className="text-muted-foreground">{t("per month")}</div>
                    <ul className="mt-4 space-y-2">
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("All Professional features")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("API access")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Dedicated support")}
                      </li>
                      <li className="flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        {t("Custom integrations")}
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => setLocation("/subscribe/enterprise")}
                    >
                      {t("Select Plan")}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => proceedToNextStep('choose_plan', 'payment')}
              >
                {t("Skip for Now")}
              </Button>
            </div>
          </div>
        );
        
      case 'payment':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-md text-green-800">
              {t("Complete your subscription payment to access all features.")}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <CreditCard className="h-16 w-16 text-primary" />
              <p className="text-center">
                {t("Please complete your payment to activate your subscription. You can also skip this step and subscribe later.")}
              </p>
              
              <div className="flex flex-col w-full space-y-3">
                <Button 
                  onClick={() => setLocation("/subscribe/professional")}
                >
                  {t("Complete Payment")}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => proceedToNextStep('payment', 'completed')}
                >
                  {t("Skip for Now")}
                </Button>
              </div>
            </div>
          </div>
        );
        
      case 'completed':
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded-md text-green-800">
              {t("Congratulations! Your account is fully set up.")}
            </div>
            
            <div className="flex flex-col items-center space-y-4">
              <Check className="h-16 w-16 text-green-500" />
              <p className="text-center">
                {t("You have completed the onboarding process. You can now access all features of the platform based on your subscription.")}
              </p>
              
              <Button 
                onClick={() => setLocation("/dashboard")}
              >
                {t("Go to Dashboard")}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Get progress percentage for the progress bar
  const getProgressPercentage = () => {
    const stepCount = Object.keys(stepMap).length - 1; // Exclude completed step from count
    const currentStepIndex = activeStep;
    return Math.round((currentStepIndex / stepCount) * 100);
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-b from-background to-background/90">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 shadow-lg overflow-hidden">
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-gray-100">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <CardHeader className={`text-center ${language === 'ar' ? 'rtl' : 'ltr'}`}>
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{t("Welcome to Esddar")}</CardTitle>
            <CardDescription>
              {t("Complete these steps to set up your account and start finding relevant tenders.")}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Stepper UI */}
            <div className="mb-8">
              <Steps 
                value={activeStep} 
                onChange={(value) => {
                  // Only allow moving to steps that should be accessible
                  if (
                    (value === 0) || // Always allow going to email verification
                    (value === 1 && onboardingStatus.emailVerified) || // Allow document upload if email verified
                    (value === 2 && !!onboardingStatus.documentStatus) || // Allow plan selection if document uploaded
                    (value === 3 && activeStep >= 2) || // Allow payment if past plan selection
                    (value === 4 && onboardingStatus.completed) // Allow completed if onboarding is done
                  ) {
                    setActiveStep(value);
                  } else {
                    // Show message about completing previous steps
                    toast({
                      title: t("Complete previous steps"),
                      description: t("Please complete the previous steps first before proceeding."),
                      variant: "default",
                    });
                  }
                }}
                className="w-full px-4"
              >
                <Step value={0}>
                  <StepStatus complete={onboardingStatus.emailVerified} />
                  <div className="ml-3 flex flex-col">
                    <StepLabel>{t("Verify Email")}</StepLabel>
                    <StepDescription>{t("Confirm your email address")}</StepDescription>
                  </div>
                  <StepSeparator />
                </Step>
                
                <Step value={1}>
                  <StepStatus complete={!!onboardingStatus.documentStatus} />
                  <div className="ml-3 flex flex-col">
                    <StepLabel>{t("Upload Document")}</StepLabel>
                    <StepDescription>{t("Company profile")}</StepDescription>
                  </div>
                  <StepSeparator />
                </Step>
                
                <Step value={2}>
                  <StepStatus complete={activeStep > 2} />
                  <div className="ml-3 flex flex-col">
                    <StepLabel>{t("Choose Plan")}</StepLabel>
                    <StepDescription>{t("Select subscription")}</StepDescription>
                  </div>
                  <StepSeparator />
                </Step>
                
                <Step value={3}>
                  <StepStatus complete={onboardingStatus.hasSubscription || activeStep > 3} />
                  <div className="ml-3 flex flex-col">
                    <StepLabel>{t("Payment")}</StepLabel>
                    <StepDescription>{t("Complete subscription")}</StepDescription>
                  </div>
                  <StepSeparator />
                </Step>
                
                <Step value={4}>
                  <StepStatus complete={onboardingStatus.completed} />
                  <div className="ml-3 flex flex-col">
                    <StepLabel>{t("Complete")}</StepLabel>
                    <StepDescription>{t("Start using platform")}</StepDescription>
                  </div>
                </Step>
              </Steps>
            </div>
            
            {/* Step content */}
            <motion.div 
              className="mt-8 p-4 rounded-lg"
              key={onboardingStatus.currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
            
            {/* Navigation buttons */}
            <div className={`flex ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'} justify-between mt-8`}>
              {activeStep > 0 && activeStep < 4 && (
                <Button
                  variant="outline"
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="flex items-center gap-2"
                >
                  {language === 'ar' ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                  {t("Previous")}
                </Button>
              )}
              {activeStep < 4 && (
                <div className={`${activeStep === 0 ? (language === 'ar' ? 'mr-auto' : 'ml-auto') : ''}`}>
                  <Progress value={getProgressPercentage()} className="w-24 h-2 mb-1" />
                  <p className="text-xs text-muted-foreground text-right">
                    {getProgressPercentage()}% {t("Complete")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;