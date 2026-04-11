import { AnimatePresence, motion } from 'framer-motion';
import type { ChallengeCard } from '../../types/game';

interface TransitionOverlayProps {
  visible: boolean;
  round: number;
  activeChallenge: ChallengeCard | null;
  accentColor: string;
}

/**
 * Full-screen flash overlay during track transitions.
 * Shows "DRINK!" in neon lettering, the round number,
 * and any active challenge card text.
 */
export default function TransitionOverlay({
  visible,
  round,
  activeChallenge,
  accentColor,
}: TransitionOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Bright flash layer */}
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${accentColor}55 0%, transparent 70%)`,
            }}
          />

          {/* Dark scrim behind text */}
          <div className="absolute inset-0 bg-surface/70" />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* DRINK! */}
            <motion.h1
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="text-7xl sm:text-8xl md:text-9xl font-black text-neon-pink select-none"
              style={{
                textShadow:
                  '0 0 40px rgba(255, 45, 138, 0.9), 0 0 80px rgba(255, 45, 138, 0.5), 0 0 120px rgba(255, 45, 138, 0.3)',
              }}
            >
              DRINK!
            </motion.h1>

            {/* Round badge */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="text-xl sm:text-2xl font-semibold text-text-secondary"
            >
              Round {round}
            </motion.p>

            {/* Challenge card */}
            {activeChallenge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-4 max-w-md px-6 py-4 rounded-2xl border border-neon-purple/40 bg-surface-light/80 backdrop-blur-sm"
              >
                <p className="text-sm font-semibold text-neon-purple uppercase tracking-wider mb-2">
                  Challenge
                </p>
                <p className="text-lg text-text-primary leading-snug">
                  {activeChallenge.text}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
