import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';

/**
 * 5-second countdown overlay shown before the game begins.
 * Large animated numbers pulse in the center.
 * Calls startGame() when countdown reaches zero.
 */
export default function PreGameCountdown() {
  const [count, setCount] = useState(5);
  const startGame = useGameStore((s) => s.startGame);

  useEffect(() => {
    if (count <= 0) {
      startGame();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, startGame]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface">
      {/* Pulsing background glow */}
      <div
        className="absolute inset-0 animate-[bg-pulse_2s_ease-in-out_infinite]"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(180, 74, 255, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Heading */}
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-2xl sm:text-3xl font-bold text-neon-purple mb-12 tracking-wide"
        style={{ textShadow: '0 0 20px rgba(180, 74, 255, 0.6)' }}
      >
        Get Your Drinks Ready!
      </motion.p>

      {/* Countdown number */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute text-[8rem] font-black text-neon-blue select-none tabular-nums"
              style={{
                textShadow:
                  '0 0 40px rgba(0, 212, 255, 0.8), 0 0 80px rgba(0, 212, 255, 0.4)',
              }}
            >
              {count}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
