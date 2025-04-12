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

  // Add icons to achievements based on their ID
  useEffect(() => {
    if (achievements.length > 0) {
      const achievementsWithIcons = achievements.map(achievement => {
        let icon;
        
        // Assign appropriate icon based on achievement ID
        switch (achievement.id) {
          case 'first_login':
            icon = <LightbulbIcon className="h-6 w-6 text-yellow-500" />;
            break;
          case 'email_verified':
            icon = <Medal className="h-6 w-6 text-green-500" />;
            break;
          case 'profile_completed':
            icon = <Award className="h-6 w-6 text-purple-500" />;
            break;
          case 'document_uploaded':
            icon = <Award className="h-6 w-6 text-blue-500" />;
            break;
          case 'first_saved_tender':
            icon = <Star className="h-6 w-6 text-yellow-500" />;
            break;
          case 'first_application':
            icon = <Medal className="h-6 w-6 text-blue-500" />;
            break;
          case 'subscription_started':
            icon = <Award className="h-6 w-6 text-amber-500" />;
            break;
          case 'tutorial_completed':
            icon = <Trophy className="h-6 w-6 text-amber-500" />;
            break;
          case 'tender_explorer':
            icon = <Medal className="h-6 w-6 text-green-500" />;
            break;
          case 'profile_master':
            icon = <Award className="h-6 w-6 text-purple-500" />;
            break;
          default:
            icon = <Star className="h-6 w-6 text-blue-500" />;
        }
        
        return {
          ...achievement,
          icon
        };
      });
      
      setAchievements(achievementsWithIcons);
    }
  }, [achievements.length]);

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
      <Card className="overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/20 dark:to-background z-0"></div>
        <CardHeader className="pb-2 relative z-10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold bg-gradient-to-br from-primary to-primary-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-primary-300">
              {t("Your Achievements")}
            </CardTitle>
            <Badge className={`${userTier.color.replace('text-', 'bg-')} text-white shadow-sm`}>
              {userTier.name}
            </Badge>
          </div>
          <CardDescription>{t("Complete tasks to earn points and unlock rewards")}</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-2">
                <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="font-semibold text-lg">{t("Level")} {userLevel}</span>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">{userPoints} / {nextLevelPoints} {t("points")}</span>
            </div>
          </div>
          <div className="relative h-3 mb-2">
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"></div>
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-primary-600 dark:from-primary-600 dark:to-primary-400"
              style={{ width: `${Math.min(levelProgress, 100)}%`, transition: 'width 1s ease-in-out' }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {[0, 25, 50, 75, 100].map(milestone => (
                <div 
                  key={milestone} 
                  className={`w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-800 z-10 ${milestone <= levelProgress ? 'opacity-100' : 'opacity-50'}`}
                  style={{ marginLeft: `${milestone}%`, transform: 'translateX(-50%)' }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="font-bold text-lg text-primary-600 dark:text-primary-400">{unlockedAchievements.length}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">{t("Unlocked")}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="font-bold text-lg text-gray-600 dark:text-gray-400">{lockedAchievements.length}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">{t("Locked")}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="font-bold text-lg text-amber-500 dark:text-amber-400">{userPoints}</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">{t("Points")}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 relative z-10">
          <Button 
            variant={isExpanded ? "outline" : "default"}
            className={`w-full flex items-center justify-center shadow-sm transition-all duration-300 ${
              isExpanded 
                ? "bg-white dark:bg-gray-800" 
                : "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white"
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                {t("Hide Achievements")}
                <ChevronUp className="ml-2 h-4 w-4 animate-bounce" />
              </>
            ) : (
              <>
                {t("Show All Achievements")}
                <ChevronDown className="ml-2 h-4 w-4 animate-pulse" />
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
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-gray-800/30 overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 h-16 w-16 -mr-8 -mt-8 bg-green-200 dark:bg-green-800/30 rounded-full opacity-50"></div>
                    <CardContent className="pt-4 relative">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-md border border-green-100 dark:border-green-800/30">
                          {achievement.icon}
                        </div>
                        <div className="ml-4">
                          <h4 className="font-semibold text-lg text-green-800 dark:text-green-300">
                            {achievement.name[language === 'ar' ? 'ar' : 'en']}
                          </h4>
                          <p className="text-sm text-green-700/70 dark:text-green-400/70">
                            {achievement.description[language === 'ar' ? 'ar' : 'en']}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center bg-green-100 dark:bg-green-800/40 px-2 py-1 rounded-full text-xs text-green-700 dark:text-green-300">
                              <Star className="h-3 w-3 mr-1 text-yellow-500" />
                              <span>+{achievement.points} {t("points")}</span>
                            </div>
                            {achievement.dateUnlocked && (
                              <span className="text-xs text-green-600/50 dark:text-green-400/50 italic">
                                {t("Unlocked")}: {new Date(achievement.dateUnlocked).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {/* Locked achievements */}
              {lockedAchievements.map(achievement => (
                <motion.div
                  key={achievement.id}
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/20 dark:to-gray-800/30 overflow-hidden">
                    <CardContent className="pt-4 relative">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 bg-gray-100 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                          <Lock className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <h4 className="font-medium text-gray-700 dark:text-gray-300">
                            {achievement.name[language === 'ar' ? 'ar' : 'en']}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {achievement.description[language === 'ar' ? 'ar' : 'en']}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <Star className="h-3 w-3 mr-1 text-gray-400" />
                            <span>+{achievement.points} {t("points")}</span>
                          </div>
                          
                          {achievement.progress !== undefined && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">{t("Progress")}</span>
                                <span className="text-primary-600 dark:text-primary-400 font-medium">{achievement.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-gray-400 to-gray-500 dark:from-gray-600 dark:to-gray-500" 
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};