

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { UserProfile, ShopItem, Achievement } from '../types';
import { ACHIEVEMENTS_DATA } from '../constants';
import { getAllCoursesData } from '../data/course-data';
import toast from 'react-hot-toast';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  userData: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  isPurchasing: boolean;
  signOut: () => Promise<void>;
  updateUserData: (updates: Partial<UserProfile>) => Promise<void>;
  purchaseItem: (item: ShopItem) => Promise<void>;
  applyTheme: (themeId: string) => Promise<void>;
  unlockedAchievement: Achievement | null;
  showAchievementNotification: (achievement: Achievement) => void;
  hideAchievementNotification: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((authUser: User | null) => {
      setUser(authUser);
      if (!authUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeDb: (() => void) | undefined;

    if (user) {
      setLoading(true);
      unsubscribeDb = db.onSnapshot('profiles', user.id, (payload) => {
        if (payload.exists()) {
          setUserData(payload.data() as UserProfile);
        } else {
          console.log("User profile doesn't exist. It should be created by a trigger.");
        }
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribeDb) {
        unsubscribeDb();
      }
    };
  }, [user]);

  const showAchievementNotification = useCallback((achievement: Achievement) => {
    setUnlockedAchievement(achievement);
  }, []);

  const hideAchievementNotification = useCallback(() => {
    setUnlockedAchievement(null);
  }, []);
  
  const updateUserData = useCallback(async (updates: Partial<Omit<UserProfile, 'id' | 'email'>>) => {
    if (!user) return;
    try {
      const { error } = await db.from('profiles').update(updates).eq('id', user.id);
      if (error) throw error;
    } catch (error: any) {
      console.error("Failed to update user data:", error);
      toast.error(error.message || "There was an issue saving your data.");
      throw error; // re-throw to be caught by caller
    }
  }, [user]);

  const purchaseItem = useCallback(async (item: ShopItem) => {
    if (!userData || !user || isPurchasing) return;

    if (userData.ai_coins < item.cost) {
      toast.error("Not enough AI Coins!");
      return;
    }

    setIsPurchasing(true);
    const toastId = toast.loading(`Processing purchase...`);
    
    try {
        const newAiCoins = userData.ai_coins - item.cost;
        const newTotalSpent = userData.total_coins_spent + item.cost;
        let updates: Partial<UserProfile> = { ai_coins: newAiCoins, total_coins_spent: newTotalSpent };
        
        if (item.type === 'theme') {
          updates.purchased_themes = [...userData.purchased_themes, item.id];
        } else if (item.type === 'power-up') {
          const powerUpKey = item.id.replace('powerup-', '');
          updates.purchased_power_ups = {
            ...userData.purchased_power_ups,
            [powerUpKey]: (userData.purchased_power_ups?.[powerUpKey] || 0) + 1,
          };
        }

        // Check for 'Big Spender' achievement
        const bigSpenderAchievement = ACHIEVEMENTS_DATA.find(a => a.id === 'high-roller');
        if (bigSpenderAchievement && newTotalSpent >= 1000 && !userData.achievements.includes('high-roller')) {
            updates.achievements = [...userData.achievements, 'high-roller'];
            updates.xp = userData.xp + bigSpenderAchievement.reward.xp;
            showAchievementNotification(bigSpenderAchievement);
        }
        
        await updateUserData(updates);
        toast.success(`Successfully purchased ${item.name}!`, { id: toastId });
    } catch (error) {
        toast.error('Purchase failed. Please try again.', { id: toastId });
    } finally {
        setIsPurchasing(false);
    }
  }, [user, userData, updateUserData, showAchievementNotification, isPurchasing]);
  
  const applyTheme = useCallback(async (themeId: string) => {
    if (!userData || !userData.purchased_themes.includes(themeId)) {
        toast.error("You don't own this theme!");
        return;
    }
    await updateUserData({ active_theme: themeId });
    toast.success("Theme applied!");
  }, [userData, updateUserData]);

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserData(null);
      toast.success("Signed out successfully!");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out.");
    }
  };

  const isAdmin = userData?.role === 'admin';

  const value = { user, userData, isAdmin, loading, isPurchasing, signOut, updateUserData, purchaseItem, applyTheme, unlockedAchievement, showAchievementNotification, hideAchievementNotification };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};