

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Card, { CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { SHOP_ITEMS_DATA, ACHIEVEMENTS_DATA } from '../constants';
import { getAllCoursesMetadata } from '../data/course-data';
import CircularProgress from '../components/CircularProgress';
import Button from '../components/Button';
import { ShopItem, LeaderboardUser } from '../types';
import { Award, Coins, Flame, Lightbulb, ShieldHalf, SkipForward, Star, Gem, Play, RotateCcw, Loader2, Trophy } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import { db } from '../services/firebase';

const ThemePreview: React.FC<{ themeId: string }> = ({ themeId }) => {
    const gradients: { [key: string]: string } = {
        'theme-synthwave': 'from-pink-500 via-purple-500 to-indigo-500',
        'theme-mint': 'from-green-300 to-teal-400',
        'theme-solar': 'from-yellow-400 via-orange-500 to-red-500',
        'theme-ocean': 'from-blue-400 to-cyan-500',
        'deep-space': 'from-blue-700 via-indigo-700 to-purple-800',
        'theme-emerald': 'from-green-500 to-emerald-600',
        'theme-violet': 'from-violet-500 to-purple-600',
        'theme-sakura': 'from-pink-300 to-rose-400',
        'theme-cyberpunk': 'from-cyan-400 to-pink-500',
        'theme-desert': 'from-yellow-600 to-orange-400',
        'theme-crimson': 'from-red-600 to-red-800',
        'theme-lavender': 'from-purple-300 to-indigo-400',
        'theme-nordic': 'from-gray-400 to-blue-300',
        'theme-aurora': 'from-green-400 via-teal-500 to-purple-500',
        'theme-gilded': 'from-yellow-500 via-amber-500 to-yellow-600',
        'theme-velvet': 'from-red-500 to-rose-700',
        'theme-diamond': 'from-blue-300 via-cyan-300 to-blue-400',
        'theme-high-contrast': 'from-yellow-400 to-blue-500',
    };
    return <div className={`h-16 w-full rounded-lg bg-gradient-to-r ${gradients[themeId] || 'from-gray-500 to-gray-700'}`}></div>;
}

const PowerUpIcon: React.FC<{ type: string }> = ({ type }) => {
    const iconProps = { className: "w-8 h-8 text-accent" };
    switch (type) {
        case 'hint': return <Lightbulb {...iconProps}/>;
        case '5050': return <ShieldHalf {...iconProps}/>;
        case 'skip': return <SkipForward {...iconProps}/>;
        case 'double-xp': return <Star {...iconProps}/>;
        case 'second-chance': return <RotateCcw {...iconProps}/>;
        default: return <Gem {...iconProps}/>;
    }
}

// Moved StatCard outside the DashboardPage component and wrapped with React.memo for performance.
const StatCard: React.FC<{icon: React.ReactNode, label: string, value: string | number, className?: string}> = ({ icon, label, value, className }) => (
    <div className={`p-4 rounded-lg bg-secondary/50 flex items-center gap-4 ${className}`}>
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
);
const MemoizedStatCard = React.memo(StatCard);


const DashboardPage: React.FC = () => {
  const { userData, purchaseItem, applyTheme, isPurchasing } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      const data = await getAllCoursesMetadata();
      setAllCourses(data);
      setCoursesLoading(false);
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
        if (!userData) return;
        setLeaderboardLoading(true);
        try {
            const { data, error } = await db.rpc('get_leaderboard_data', { p_user_id: userData.id, p_limit: 5 });
            if (error) throw error;
            setLeaderboard(data || []);
        } catch (error) {
            console.error('Failed to fetch leaderboard preview:', error);
        } finally {
            setLeaderboardLoading(false);
        }
    };
    fetchLeaderboard();
  }, [userData]);
  
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary" />
      </div>
    );
  }
  
  const totalTenses = allCourses.reduce((acc, course) => acc + (course.tenseCount || 0), 0);
  const completedTenses = Object.values(userData.course_progress || {}).flatMap(course => Object.values(course)).filter((tense: any) => tense.completed).length;
  const overallCompletion = totalTenses > 0 ? (completedTenses / totalTenses) * 100 : 0;
  
  const startedCourses = allCourses.filter(course => {
    const progress = userData.course_progress?.[course.id];
    if (!progress) return false;
    const attemptedCount = Object.keys(progress).length;
    if (attemptedCount === 0) return false;

    const completedCount = Object.values(progress).filter((p: any) => p.completed).length;
    const isFullyCompleted = completedCount === course.tenseCount;
    
    return attemptedCount > 0 && !isFullyCompleted;
  });

  const unlockedAchievementIds = new Set(userData.achievements || []);
  const powerUps = SHOP_ITEMS_DATA.filter(item => item.type === 'power-up');
  const themes = SHOP_ITEMS_DATA.filter(item => item.type === 'theme');
  
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-12 md:space-y-16">
      {/* Welcome Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
          Welcome back, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{userData.username}!</span>
        </h1>
        <p className="text-muted-foreground text-lg">Here's a summary of your journey so far.</p>
      </div>
      
      {/* Progress Section */}
      <section id="progress-overview">
        <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent inline-block">Your Progress</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {coursesLoading ? (
             <Card className="lg:col-span-1 flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Calculating Progress...</p>
            </Card>
          ) : (
            <Card className="lg:col-span-1 flex flex-col">
                <CardHeader><CardTitle>Overall Completion</CardTitle></CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                <CircularProgress value={overallCompletion} label={`${completedTenses}/${totalTenses} Tenses`} />
                </CardContent>
                <CardFooter className="justify-center">
                    <Button variant="outline" onClick={() => navigate('/progress-details')}>View Details</Button>
                </CardFooter>
            </Card>
          )}
          <Card id="stats-card" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
              <CardDescription>A look at your accomplishments and stats.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <MemoizedStatCard icon={<Star className="w-8 h-8" />} label="Total XP" value={userData.xp.toLocaleString()} />
                  <div className="p-4 rounded-lg bg-secondary/50 flex flex-col justify-center">
                      <p className="text-sm text-muted-foreground">Level {Math.floor(userData.xp / 500) + 1}</p>
                      <ProgressBar value={(userData.xp % 500) / 500 * 100} />
                      <p className="text-xs text-muted-foreground text-right mt-1">{(userData.xp % 500)} / 500 XP</p>
                  </div>
                  <MemoizedStatCard icon={<Play className="w-8 h-8" />} label="Quizzes Done" value={userData.total_quizzes_completed} />
                  <MemoizedStatCard icon={<Flame className="w-8 h-8" />} label="Day Streak" value={userData.streak_days} />
                  <MemoizedStatCard icon={<Award className="w-8 h-8" />} label="Achievements" value={`${unlockedAchievementIds.size}/${ACHIEVEMENTS_DATA.length}`} />
                  <MemoizedStatCard icon={<Coins className="w-8 h-8" />} label="AI Coins" value={userData.ai_coins.toLocaleString()} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
      <section id="leaderboard-preview">
        <h2 className="text-3xl font-bold mb-8">Leaderboard</h2>
        <Card>
            <CardHeader>
                <CardTitle>Top Learners</CardTitle>
                <CardDescription>See who's at the top of their game.</CardDescription>
            </CardHeader>
            <CardContent>
                {leaderboardLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {leaderboard.map((player, index) => (
                            <div key={player.id} className={`flex items-center p-3 rounded-lg ${player.id === userData.id ? 'bg-primary/10' : 'bg-secondary/50'}`}>
                                <div className="w-10 font-bold text-lg text-center">{player.rank}</div>
                                <div className="flex-1 font-semibold text-lg">{player.username} {player.id === userData.id && <span className="text-xs text-primary font-normal">(You)</span>}</div>
                                <div className="flex items-center gap-2 font-bold text-primary">
                                    <Star className="w-5 h-5"/>
                                    {player.xp.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={() => navigate('/leaderboard')}>
                    <Trophy className="mr-2 h-4 w-4"/> View Full Leaderboard
                </Button>
            </CardFooter>
        </Card>
      </section>


      {/* Power-Up Inventory Section */}
      <section id="inventory">
        <h2 className="text-3xl font-bold mb-8">My Power-Ups</h2>
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {powerUps.map(item => {
                        const powerUpKey = item.id.replace('powerup-', '');
                        const count = userData.purchased_power_ups[powerUpKey] || 0;
                        return (
                            <div key={item.id} className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-secondary/50 border border-border">
                                <PowerUpIcon type={powerUpKey} />
                                <p className="font-bold mt-2">{item.name}</p>
                                <p className="text-2xl font-bold text-primary">{count}</p>
                                <p className="text-sm text-muted-foreground">Owned</p>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
      </section>

       {/* Continue Learning Section */}
      {coursesLoading ? (
          <section id="courses-overview">
              <h2 className="text-3xl font-bold mb-8">Continue Learning</h2>
              <Card>
                  <CardContent className="pt-6">
                      <div className="flex justify-center items-center h-40">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                  </CardContent>
              </Card>
          </section>
      ) : (
        startedCourses.length > 0 && (
          <section id="courses-overview">
            <h2 className="text-3xl font-bold mb-8">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {startedCourses.map(course => (
                <Card key={course.id} className="hover:shadow-primary/20 hover:-translate-y-1 transition-transform duration-300">
                  <CardHeader>
                    <CardTitle>{course.name}</CardTitle>
                    <CardDescription>You're making great progress. Keep it up!</CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button onClick={() => navigate(`/course/${course.id}`)}>
                      Continue Course <Play className="ml-2 h-4 w-4"/>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </section>
        )
      )}

      {/* Achievements Section */}
      <section id="achievements">
        <h2 className="text-3xl font-bold mb-8">Achievements ({unlockedAchievementIds.size}/{ACHIEVEMENTS_DATA.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS_DATA.map(ach => {
                const isUnlocked = unlockedAchievementIds.has(ach.id);
                return (
                    <Card key={ach.id} className={`p-4 text-center transition-all ${isUnlocked ? 'border-accent/50 bg-accent/10' : 'opacity-60'}`}>
                        <Award className={`w-10 h-10 mx-auto ${isUnlocked ? 'text-accent' : 'text-muted-foreground'}`}/>
                        <p className="font-bold mt-2">{ach.name}</p>
                        <p className="text-sm text-muted-foreground">{ach.description}</p>
                    </Card>
                );
            })}
        </div>
      </section>
      
      {/* Shop Section */}
      <section id="shop-overview">
        <h2 className="text-3xl font-bold mb-8">Shop</h2>
        <div className="grid grid-cols-1 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Themes</CardTitle>
                    <CardDescription>Customize your learning experience. You have <span className="font-bold text-coin">{userData.ai_coins.toLocaleString()} AI Coins</span>.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {themes.map(item => {
                        const isOwned = userData.purchased_themes.includes(item.id);
                        const isActive = userData.active_theme === item.id;
                        return (
                            <Card key={item.id} className={`flex flex-col ${isActive ? 'border-primary' : ''}`}>
                                <CardHeader>
                                    <ThemePreview themeId={item.id}/>
                                    <div className="flex justify-between items-baseline mt-4">
                                        <CardTitle className="text-lg">{item.name}</CardTitle>
                                        {item.id === 'theme-diamond' ? (
                                            <span className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-blue-400 to-purple-500 text-white px-2 py-1 rounded-full shadow-lg shadow-purple-500/30">Ultimate</span>
                                        ) : item.premium && (
                                            <span className="text-xs font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-1 rounded-full">Premium</span>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </CardContent>
                                <CardFooter>
                                    {isOwned ? (
                                        <Button className="w-full" variant={isActive ? 'secondary' : 'outline'} onClick={() => applyTheme(item.id)} disabled={isActive}>
                                            {isActive ? 'Active' : 'Apply'}
                                        </Button>
                                    ) : (
                                        <Button className="w-full" onClick={() => purchaseItem(item)} disabled={isPurchasing || userData.ai_coins < item.cost}>
                                            <Coins className="mr-2 h-4 w-4"/> {item.cost}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        )
                    })}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Power-ups</CardTitle>
                    <CardDescription>Get an edge in your quizzes.</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {powerUps.map(item => (
                        <Card key={item.id} className="text-center">
                            <CardContent className="pt-6">
                                <PowerUpIcon type={item.id.replace('powerup-', '')} />
                                <p className="font-bold mt-2">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Owned: {userData.purchased_power_ups[item.id.replace('powerup-', '')] || 0}</p>
                                <Button size="sm" className="w-full mt-4" onClick={() => purchaseItem(item)} disabled={isPurchasing || userData.ai_coins < item.cost}>
                                    <Coins className="mr-2 h-4 w-4"/> {item.cost}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                 </CardContent>
            </Card>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
