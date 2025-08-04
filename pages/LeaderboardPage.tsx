

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { LeaderboardUser } from '../types';
import Button from '../components/Button';
import { ArrowLeft, Loader2, Award, Star, Crown } from 'lucide-react';
import * as ReactRouterDOM from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';


// Custom hook for animating numbers
const useAnimatedCounter = (endValue: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startValue = useRef(0);

  useEffect(() => {
    startValue.current = 0; // Reset start value on new endValue
  }, [endValue]);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const currentProgress = Math.min(progress / duration, 1);
      const current = Math.floor(startValue.current + currentProgress * (endValue - startValue.current));
      
      setCount(current);

      if (progress < duration) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setCount(endValue); // Ensure it ends on the exact value
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
        }
    };
  }, [endValue, duration]);

  return count;
};

// --- Player Card Component ---
interface PlayerCardProps {
  player: LeaderboardUser;
  isCurrentUser: boolean;
}

// Memoized player card without animation delay, as it's not needed for virtualization.
const PlayerCard: React.FC<PlayerCardProps> = ({ player, isCurrentUser }) => {
  const animatedXP = useAnimatedCounter(player.xp);
  const level = Math.floor(player.xp / 500) + 1;
  const xpInCurrentLevel = player.xp % 500;
  const progressPercent = (xpInCurrentLevel / 500) * 100;

  const rankClasses: {[key: number]: string} = {
    1: 'rank-1', 2: 'rank-2', 3: 'rank-3'
  };
  const rankClass = rankClasses[player.rank] || '';

  return (
    <div
      className={`leaderboard-list-item flex items-center p-4 rounded-xl border bg-card/60 backdrop-blur-sm shadow-lg shadow-black/20 ${rankClass} ${isCurrentUser ? 'current-user' : 'border-border'}`}
      style={{ animation: 'list-item-appear 0.5s ease-out forwards' }} // Keep entry animation
      data-interactive
    >
      <div className="rank-badge">
        {player.rank === 1 && <Crown className="podium-icon text-yellow-400" />}
        {player.rank}
      </div>

      <div className="flex-grow mx-4">
        <p className="font-bold text-lg text-foreground truncate">{player.username}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="font-bold text-sm text-primary">Lv. {level}</span>
          <div className="level-progress-bar flex-grow">
            <div className="level-progress-bar-inner" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <div className="flex items-center gap-2 font-extrabold text-primary text-xl">
          <Star className="w-5 h-5" />
          <span>{animatedXP.toLocaleString()}</span>
        </div>
        <span className="text-xs text-muted-foreground">XP</span>
      </div>
    </div>
  );
};
const MemoizedPlayerCard = React.memo(PlayerCard);


// --- Main Leaderboard Page ---
const LeaderboardPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboardData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetching a larger list for virtualization to be effective
                const { data, error } = await db.rpc('get_leaderboard_data', { 
                    p_user_id: user.id,
                    p_limit: 500 
                });
                if (error) throw error;
                
                const allPlayers = data || [];
                const foundUser = allPlayers.find(p => p.id === user.id) || null;
                setCurrentUserData(foundUser);
                setLeaderboard(allPlayers);
            } catch (error: any) {
                console.error("Failed to fetch leaderboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, [user]);

    // Define the Row component for react-window
    // It needs to be memoized to prevent re-renders on scroll, which is a key performance optimization.
    const Row = React.useCallback(({ index, style }: { index: number, style: React.CSSProperties }) => {
        const player = leaderboard[index];
        if (!player) return null;
        return (
            <div style={{ ...style, paddingBottom: '12px', paddingLeft: '2px', paddingRight: '2px' }}>
                <MemoizedPlayerCard
                    player={player}
                    isCurrentUser={player.id === user?.id}
                />
            </div>
        );
    }, [leaderboard, user?.id]);
    
    return (
        <div className="hall-of-fame-container" style={{ height: 'calc(100vh - 80px)' }}> {/* 80px is header height */}
            <div className="container mx-auto p-4 md:p-8 flex flex-col h-full">
                <header className="mb-8 md:mb-12 flex-shrink-0">
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                    <div className="text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent" style={{ textShadow: '0 2px 10px hsl(var(--background) / 0.5)' }}>Hall of Fame</h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                            Celebrate the achievements of our top learners. Your dedication inspires us all!
                        </p>
                    </div>
                </header>

                <div className="max-w-3xl mx-auto w-full flex-grow relative">
                    <AutoSizer>
                        {({ height, width }) => {
                            if (loading) {
                                return (
                                    <div style={{ height, width }} className="flex items-center justify-center">
                                        <Loader2 className="w-16 h-16 animate-spin text-primary" />
                                    </div>
                                );
                            }

                            if (leaderboard.length > 0) {
                                return (
                                    <List
                                        height={height}
                                        itemCount={leaderboard.length}
                                        itemSize={88} // 76px for card + 12px for gap
                                        width={width}
                                    >
                                        {Row}
                                    </List>
                                );
                            }
                            
                            return (
                                <div style={{ height, width }} className="flex items-center justify-center text-muted-foreground">
                                    <p>The leaderboard is empty.</p>
                                </div>
                            );
                        }}
                    </AutoSizer>
                </div>

                {/* Sticky User Card */}
                {!loading && currentUserData && (
                   <div className="sticky-user-card flex-shrink-0 mt-4 p-2 rounded-t-xl">
                       <div className="max-w-3xl mx-auto">
                           <MemoizedPlayerCard player={currentUserData} isCurrentUser={true} />
                       </div>
                   </div>
                )}
            </div>
        </div>
    );
};

export default LeaderboardPage;