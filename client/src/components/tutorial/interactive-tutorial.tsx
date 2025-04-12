import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Star, Trophy, Award, BookOpen, LightbulbIcon, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TutorialStep {
  id: string;
  title: {
    en: string;
    ar: string;
  };
  content: {
    en: string;
    ar: string;
  };
  targetElementSelector?: string;
  image?: string;
  position?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  points?: number;
  achievement?: {
    id: string;
    name: {
      en: string;
      ar: string;
    };
    description: {
      en: string;
      ar: string;
    };
    icon: JSX.Element;
  };
}

interface AchievementEarned {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  points: number;
  timestamp: Date;
}

interface TutorialProps {
  autoStart?: boolean;
  onComplete?: () => void;
  tutorialKey: string;
}

export const InteractiveTutorial = ({ autoStart = true, onComplete, tutorialKey }: TutorialProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(autoStart);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userPoints, setUserPoints] = useState(0);
  const [earnedAchievements, setEarnedAchievements] = useState<AchievementEarned[]>([]);
  const [achievementPopup, setAchievementPopup] = useState<AchievementEarned | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Tutorial steps specific to the dashboard
  const dashboardTutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: {
        en: 'Welcome to Esddar!',
        ar: 'مرحباً بك في إصدار!'
      },
      content: {
        en: 'Thank you for joining us! This quick tour will guide you through the main features of the platform.',
        ar: 'شكراً لانضمامك إلينا! ستساعدك هذه الجولة السريعة في التعرف على الميزات الرئيسية للمنصة.'
      },
      position: 'center',
      points: 10
    },
    {
      id: 'dashboard_overview',
      title: {
        en: 'Dashboard Overview',
        ar: 'نظرة عامة على لوحة التحكم'
      },
      content: {
        en: 'This is your main dashboard where you can view recommended tenders, your applications, and your profile status.',
        ar: 'هذه هي لوحة التحكم الرئيسية حيث يمكنك عرض المناقصات الموصى بها وطلباتك وحالة ملفك الشخصي.'
      },
      targetElementSelector: '.dashboard-overview',
      position: 'bottom',
      points: 15
    },
    {
      id: 'tenders_section',
      title: {
        en: 'Recommended Tenders',
        ar: 'المناقصات الموصى بها'
      },
      content: {
        en: 'Here you will find tenders that match your company profile. Our AI analyzes your profile to find the most relevant opportunities.',
        ar: 'ستجد هنا المناقصات التي تتطابق مع ملف شركتك. يقوم الذكاء الاصطناعي لدينا بتحليل ملفك الشخصي للعثور على أفضل الفرص ذات الصلة.'
      },
      targetElementSelector: '.recommended-tenders',
      position: 'right',
      points: 20,
      achievement: {
        id: 'tender_explorer',
        name: {
          en: 'Tender Explorer',
          ar: 'مستكشف المناقصات'
        },
        description: {
          en: 'You have discovered the recommended tenders section',
          ar: 'لقد اكتشفت قسم المناقصات الموصى بها'
        },
        icon: <Star className="h-6 w-6 text-yellow-500" />
      }
    },
    {
      id: 'applications_tracking',
      title: {
        en: 'Track Your Applications',
        ar: 'تتبع طلباتك'
      },
      content: {
        en: 'Monitor the status of your tender applications. You can see pending, accepted, and rejected applications.',
        ar: 'مراقبة حالة طلبات المناقصات الخاصة بك. يمكنك رؤية الطلبات المعلقة والمقبولة والمرفوضة.'
      },
      targetElementSelector: '.applications-tracking',
      position: 'left',
      points: 25
    },
    {
      id: 'profile_completion',
      title: {
        en: 'Complete Your Profile',
        ar: 'أكمل ملفك الشخصي'
      },
      content: {
        en: 'A complete profile helps us match you with better tenders. Update your company details for better recommendations.',
        ar: 'يساعد الملف الشخصي المكتمل في مطابقتك مع مناقصات أفضل. قم بتحديث تفاصيل شركتك للحصول على توصيات أفضل.'
      },
      targetElementSelector: '.profile-completion',
      position: 'bottom',
      points: 30,
      achievement: {
        id: 'profile_master',
        name: {
          en: 'Profile Master',
          ar: 'سيد الملف الشخصي'
        },
        description: {
          en: 'You have learned how to optimize your profile',
          ar: 'لقد تعلمت كيفية تحسين ملفك الشخصي'
        },
        icon: <Award className="h-6 w-6 text-purple-500" />
      }
    },
    {
      id: 'navigation',
      title: {
        en: 'Navigation',
        ar: 'التنقل'
      },
      content: {
        en: 'Use the sidebar to navigate between different sections of the platform.',
        ar: 'استخدم الشريط الجانبي للتنقل بين الأقسام المختلفة للمنصة.'
      },
      targetElementSelector: '.sidebar-nav',
      position: 'right',
      points: 20
    },
    {
      id: 'congratulations',
      title: {
        en: 'Congratulations!',
        ar: 'تهانينا!'
      },
      content: {
        en: 'You have completed the tutorial. You are now ready to start finding and winning government tenders!',
        ar: 'لقد أكملت البرنامج التعليمي. أنت الآن جاهز للبدء في العثور على المناقصات الحكومية والفوز بها!'
      },
      position: 'center',
      points: 50,
      achievement: {
        id: 'tutorial_graduate',
        name: {
          en: 'Tutorial Graduate',
          ar: 'خريج البرنامج التعليمي'
        },
        description: {
          en: 'You have completed the entire tutorial',
          ar: 'لقد أكملت البرنامج التعليمي بالكامل'
        },
        icon: <Trophy className="h-6 w-6 text-amber-500" />
      }
    }
  ];

  // Additional tutorials could be added here for different pages
  const tutorialStepsMap: Record<string, TutorialStep[]> = {
    'dashboard': dashboardTutorialSteps,
    // Add more tutorial key-steps pairs as needed
  };

  // Get current tutorial steps
  const tutorialSteps = tutorialStepsMap[tutorialKey] || dashboardTutorialSteps;
  const currentStep = tutorialSteps[currentStepIndex];

  // Calculate progress percentage
  useEffect(() => {
    setProgressPercentage(Math.round(((currentStepIndex + 1) / tutorialSteps.length) * 100));
  }, [currentStepIndex, tutorialSteps.length]);

  // Position the tooltip relative to the target element
  useEffect(() => {
    if (!currentStep.targetElementSelector || currentStep.position === 'center') {
      // Center in the viewport for steps without a target element
      setPosition({
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 175,
        width: 350,
        height: 300
      });
      return;
    }

    const targetElement = document.querySelector(currentStep.targetElementSelector);
    if (!targetElement) {
      console.warn(`Target element not found: ${currentStep.targetElementSelector}`);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipHeight = tooltipRef.current?.offsetHeight || 200;
    const tooltipWidth = tooltipRef.current?.offsetWidth || 300;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = rect.top - tooltipHeight - 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 10;
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 10;
        break;
      default:
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Ensure the tooltip stays within viewport bounds
    if (left < 10) left = 10;
    if (left + tooltipWidth > window.innerWidth - 10) left = window.innerWidth - tooltipWidth - 10;
    if (top < 10) top = 10;
    if (top + tooltipHeight > window.innerHeight - 10) top = window.innerHeight - tooltipHeight - 10;

    setPosition({ top, left, width: tooltipWidth, height: tooltipHeight });

    // Highlight the target element
    targetElement.classList.add('tutorial-highlight');
    
    return () => {
      targetElement.classList.remove('tutorial-highlight');
    };
  }, [currentStep, currentStepIndex]);

  const triggerConfetti = () => {
    // Simple confetti animation using DOM elements
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'fixed';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '1000';
    document.body.appendChild(confettiContainer);

    // Create confetti pieces
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
      confetti.style.borderRadius = '50%';
      confetti.style.top = `${Math.random() * 100}%`;
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.opacity = '0';
      confetti.style.animation = `confettiDrop ${Math.random() * 2 + 1}s forwards`;
      confettiContainer.appendChild(confetti);
    }

    // Create a style element for the animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confettiDrop {
        0% {
          transform: translateY(-10vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Clean up after animation
    setTimeout(() => {
      document.body.removeChild(confettiContainer);
      document.head.removeChild(style);
    }, 3000);
  };

  const handleNext = () => {
    // Award points for completing this step
    if (currentStep.points !== undefined) {
      setUserPoints(prev => prev + currentStep.points);
    }

    // Check if there's an achievement to award
    if (currentStep.achievement) {
      const newAchievement: AchievementEarned = {
        id: currentStep.achievement.id,
        name: currentStep.achievement.name[language === 'ar' ? 'ar' : 'en'],
        description: currentStep.achievement.description[language === 'ar' ? 'ar' : 'en'],
        icon: currentStep.achievement.icon,
        points: currentStep.points || 0,
        timestamp: new Date()
      };

      setEarnedAchievements(prev => [...prev, newAchievement]);
      setAchievementPopup(newAchievement);
      triggerConfetti();
    }

    // Move to next step or complete
    if (currentStepIndex < tutorialSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Submit to server that tutorial was completed
      const response = await apiRequest("POST", "/api/onboarding/complete-tutorial", {
        tutorialKey,
        pointsEarned: userPoints,
        achievementsEarned: earnedAchievements.map(a => a.id)
      });
      
      if (response.ok) {
        toast({
          title: t("Tutorial Completed"),
          description: t(`You've earned ${userPoints} points and ${earnedAchievements.length} achievements`),
        });
        
        setIsVisible(false);
        
        if (onComplete) {
          onComplete();
        }
      } else {
        console.error("Failed to save tutorial progress");
      }
    } catch (error) {
      console.error("Error saving tutorial progress:", error);
    }
  };

  const handleSkip = async () => {
    try {
      // Submit to server that tutorial was skipped
      await apiRequest("POST", "/api/onboarding/skip-tutorial", {
        tutorialKey
      });
      
      setIsVisible(false);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error skipping tutorial:", error);
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex items-center shadow-lg" 
          onClick={() => setIsVisible(true)}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          {t("Show Tutorial")}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Main tutorial tooltip */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-5 w-[350px]"
            style={{
              top: position.top,
              left: position.left,
              maxWidth: '90vw'
            }}
          >
            {/* Progress indicator */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 rounded-t-lg overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: `${progressPercentage}%` }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            
            {/* Step counter and points */}
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="text-xs">
                {t("Step {{current}} of {{total}}", { 
                  current: (currentStepIndex + 1).toString(), 
                  total: tutorialSteps.length.toString() 
                })}
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <Trophy className="h-3 w-3 mr-1" />
                {userPoints} {t("points")}
              </Badge>
            </div>

            {/* Close button */}
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={handleSkip}
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Content */}
            <h3 className="text-lg font-semibold mb-2">
              {currentStep.title[language === 'ar' ? 'ar' : 'en']}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {currentStep.content[language === 'ar' ? 'ar' : 'en']}
            </p>
            
            {currentStep.image && (
              <div className="mb-4 rounded-md overflow-hidden">
                <img 
                  src={currentStep.image} 
                  alt={currentStep.title[language === 'ar' ? 'ar' : 'en']} 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {/* Points for this step */}
            {currentStep.points && (
              <div className="mb-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {t("Complete this step to earn {{points}} points", { points: currentStep.points.toString() })}
              </div>
            )}
            
            {/* Navigation buttons */}
            <div className={`flex ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'} justify-between mt-4`}>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
              >
                {language === 'ar' ? <ChevronRight className="h-4 w-4 mr-1" /> : <ChevronLeft className="h-4 w-4 mr-1" />}
                {t("Previous")}
              </Button>
              
              <Button 
                size="sm" 
                onClick={handleNext}
              >
                {currentStepIndex < tutorialSteps.length - 1 ? t("Next") : t("Finish")}
                {language === 'ar' ? <ChevronLeft className="h-4 w-4 ml-1" /> : <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Achievement popup */}
      <AnimatePresence>
        {achievementPopup && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 30
            }}
            className="fixed bottom-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg shadow-2xl p-4 w-80"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-white/20 p-2 rounded-full">
                {achievementPopup.icon}
              </div>
              <div className="ml-3 flex-1">
                <h4 className="font-bold">{t("Achievement Unlocked!")}</h4>
                <p className="font-semibold">{achievementPopup.name}</p>
                <p className="text-sm opacity-90">{achievementPopup.description}</p>
                <div className="mt-2 flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  <span className="text-sm">+{achievementPopup.points} {t("points")}</span>
                </div>
              </div>
              <button
                className="text-white/80 hover:text-white"
                onClick={() => setAchievementPopup(null)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Add tutorial highlight styles */}
      <style jsx global>{`
        .tutorial-highlight {
          position: relative;
          z-index: 40;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4);
          border-radius: 4px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(79, 70, 229, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
          }
        }
      `}</style>
    </>
  );
};