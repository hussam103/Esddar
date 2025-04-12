import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, LightbulbIcon, Star, Award, Lock, Medal, ChevronDown, ChevronUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface Achievement {
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
  points: number;
  isUnlocked: boolean;
  progress?: number; // Optional progress percentage for achievements in progress
  dateUnlocked?: string; // Optional date when unlocked
}

interface AchievementsProps {
  userId: number;
}

export const Achievements = ({ userId }: AchievementsProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch user achievements
  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("GET", `/api/user/achievements?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          setAchievements(data.achievements);
          setUserPoints(data.points);
          setUserLevel(data.level);
        } else {
          console.error("Failed to fetch achievements");
        }
      } catch (error) {
        console.error("Error fetching achievements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [userId]);

  // Sample achievements if API doesn't return any data yet
  useEffect(() => {
    if (achievements.length === 0 && !loading) {
      const sampleAchievements: Achievement[] = [
        {
          id: 'first_login',
          name: {
            en: 'First Login',
            ar: 'الدخول الأول'
          },
          description: {
            en: 'You logged in for the first time',
            ar: 'لقد قمت بتسجيل الدخول لأول مرة'
          },
          icon: <LightbulbIcon className="h-6 w-6 text-yellow-500" />,
          points: 10,
          isUnlocked: true,
          dateUnlocked: new Date().toISOString()
        },
        {
          id: 'profile_completed',
          name: {
            en: 'Profile Expert',
            ar: 'خبير الملف الشخصي'
          },
          description: {
            en: 'Complete your profile information',
            ar: 'أكمل معلومات ملفك الشخصي'
          },
          icon: <Award className="h-6 w-6 text-purple-500" />,
          points: 25,
          isUnlocked: false,
          progress: 40
        },
        {
          id: 'first_application',
          name: {
            en: 'First Application',
            ar: 'الطلب الأول'
          },
          description: {
            en: 'Apply for your first tender',
            ar: 'تقدم بطلب للمناقصة الأولى'
          },
          icon: <Medal className="h-6 w-6 text-blue-500" />,
          points: 50,
          isUnlocked: false
        },
        {
          id: 'tutorial_completed',
          name: {
            en: 'Tutorial Graduate',
            ar: 'خريج البرنامج التعليمي'
          },
          description: {
            en: 'Complete the platform tutorial',
            ar: 'أكمل البرنامج التعليمي للمنصة'
          },
          icon: <Trophy className="h-6 w-6 text-amber-500" />,
          points: 30,
          isUnlocked: false
        }
      ];
      
      setAchievements(sampleAchievements);
    }
  }, [achievements, loading]);

  // Calculate level-based information
  const calculateNextLevelPoints = (level: number) => level * 100;
  const nextLevelPoints = calculateNextLevelPoints(userLevel);
  const levelProgress = (userPoints / nextLevelPoints) * 100;

  // Get user tier based on points
  const getUserTier = (points: number) => {
    if (points >= 1000) return { name: t('Elite'), color: 'text-amber-500' };
    if (points >= 500) return { name: t('Gold'), color: 'text-yellow-500' };
    if (points >= 250) return { name: t('Silver'), color: 'text-gray-400' };
    return { name: t('Bronze'), color: 'text-orange-500' };
  };

  const userTier = getUserTier(userPoints);

  // Get unlocked and locked achievements
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  return (
    <div className="space-y-4">
      {/* User level and points summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>{t("Your Achievements")}</CardTitle>
            <Badge className={`${userTier.color.replace('text-', 'bg-')} text-white`}>
              {userTier.name}
            </Badge>
          </div>
          <CardDescription>{t("Complete tasks to earn points and unlock rewards")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Trophy className="h-5 w-5 text-amber-500 mr-2" />
              <span className="font-semibold">{t("Level")} {userLevel}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{userPoints} / {nextLevelPoints} {t("points")}</span>
            </div>
          </div>
          <Progress value={levelProgress} className="h-2" />
          
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
              <div className="font-semibold">{unlockedAchievements.length}</div>
              <div className="text-muted-foreground">{t("Unlocked")}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
              <div className="font-semibold">{lockedAchievements.length}</div>
              <div className="text-muted-foreground">{t("Locked")}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
              <div className="font-semibold">{userPoints}</div>
              <div className="text-muted-foreground">{t("Points")}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                {t("Hide Achievements")}
                <ChevronUp className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                {t("Show All Achievements")}
                <ChevronDown className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Achievements list (expandable) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Unlocked achievements */}
              {unlockedAchievements.map(achievement => (
                <Card key={achievement.id} className="border-green-200 bg-green-50 dark:bg-green-900/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-white p-2 rounded-full shadow-sm">
                        {achievement.icon}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium">
                          {achievement.name[language === 'ar' ? 'ar' : 'en']}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description[language === 'ar' ? 'ar' : 'en']}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-green-600 dark:text-green-400">
                          <Star className="h-3 w-3 mr-1" />
                          <span>+{achievement.points} {t("points")}</span>
                          {achievement.dateUnlocked && (
                            <span className="ml-2 text-muted-foreground">
                              {new Date(achievement.dateUnlocked).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Locked achievements */}
              {lockedAchievements.map(achievement => (
                <Card key={achievement.id} className="border-gray-200 bg-gray-50 dark:bg-gray-800/20">
                  <CardContent className="pt-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 p-2 rounded-full">
                        <Lock className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300">
                          {achievement.name[language === 'ar' ? 'ar' : 'en']}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description[language === 'ar' ? 'ar' : 'en']}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Star className="h-3 w-3 mr-1" />
                          <span>+{achievement.points} {t("points")}</span>
                        </div>
                        
                        {achievement.progress !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>{t("Progress")}</span>
                              <span>{achievement.progress}%</span>
                            </div>
                            <Progress value={achievement.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};