import React, { useEffect, useState } from 'react';
import { Award, X } from 'lucide-react';
import { Achievement } from '../types';
import Card from './Card';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsExiting(false);
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [achievement]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 500); // Match animation duration
  };

  if (!achievement) return null;

  const animationClass = isExiting ? 'animate-slide-out-top' : 'animate-slide-in-top';

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
      <Card className={`border-accent/80 shadow-lg shadow-accent/20 ${animationClass}`}>
        <div className="p-4 flex items-start gap-4">
          <div className="p-2 rounded-full bg-accent mt-1">
            <Award className="w-7 h-7 text-accent-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-accent">Achievement Unlocked!</h3>
            <p className="font-semibold text-foreground">{achievement.name}</p>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          <button onClick={handleClose} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AchievementToast;