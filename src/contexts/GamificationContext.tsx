import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GamificationToast } from '@/components/ui/gamification-toast';

interface GamificationContextType {
  awardPoints: (points: number, reason: string) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [toastData, setToastData] = useState<{ isVisible: boolean; points: number; message: string }>({
    isVisible: false,
    points: 0,
    message: '',
  });

  const awardPoints = (points: number, reason: string) => {
    // In a real app, you would also save this to Supabase
    setToastData({
      isVisible: true,
      points,
      message: reason,
    });
  };

  return (
    <GamificationContext.Provider value={{ awardPoints }}>
      {children}
      <GamificationToast
        isVisible={toastData.isVisible}
        points={toastData.points}
        message={toastData.message}
        onComplete={() => setToastData(prev => ({ ...prev, isVisible: false }))}
      />
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
