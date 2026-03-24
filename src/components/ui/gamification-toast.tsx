import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GamificationToastProps {
  isVisible: boolean;
  points: number;
  message: string;
  onComplete: () => void;
}

export function GamificationToast({ isVisible, points, message, onComplete }: GamificationToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 border-2 border-amber-300">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="bg-white/20 p-2 rounded-full"
            >
              <Trophy className="w-6 h-6 text-amber-100 fill-amber-300" />
            </motion.div>

            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight flex items-center gap-1">
                +{points} XP
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              </span>
              <span className="text-sm text-amber-50 font-medium">{message}</span>
            </div>

            <div className="absolute -top-2 -right-2">
               <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
               >
                 <Star className="w-8 h-8 text-yellow-300 fill-yellow-400 drop-shadow-md" />
               </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
