import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime } from '../../utils/formatTime';

interface GameControlsProps {
  isPaused: boolean;
  round: number;
  totalRounds: number;
  totalElapsedMs: number;
  clipDurationSec: number;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onEndGame: () => void;
}

/**
 * Minimal playback controls bar overlaid at the bottom of the game screen.
 * Auto-hides after 3 seconds of inactivity; reappears on mouse/touch.
 */
export default function GameControls({
  isPaused,
  round,
  totalRounds,
  totalElapsedMs,
  clipDurationSec,
  onPause,
  onResume,
  onSkip,
  onEndGame,
}: GameControlsProps) {
  const [visible, setVisible] = useState(true);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimer.current);
    if (!isPaused) {
      hideTimer.current = setTimeout(() => setVisible(false), 3000);
    }
  }, [isPaused]);

  // Show controls when paused; start hide timer when playing
  useEffect(() => {
    if (isPaused) {
      setVisible(true);
      clearTimeout(hideTimer.current);
    } else {
      resetHideTimer();
    }
    return () => clearTimeout(hideTimer.current);
  }, [isPaused, resetHideTimer]);

  // Listen for mouse/touch activity on the entire window
  useEffect(() => {
    const handler = () => resetHideTimer();
    window.addEventListener('mousemove', handler);
    window.addEventListener('touchstart', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [resetHideTimer]);

  const totalGameMs = totalRounds * clipDurationSec * 1000;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-0 inset-x-0 z-30 pb-6 pt-16 px-4 pointer-events-none"
          style={{
            background:
              'linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0) 100%)',
          }}
        >
          <div className="max-w-lg mx-auto flex flex-col gap-3 pointer-events-auto">
            {/* Stats row */}
            <div className="flex items-center justify-between text-sm text-text-secondary px-2">
              <span className="tabular-nums">
                Round {round} / {totalRounds}
              </span>
              <span className="tabular-nums">
                {formatTime(totalElapsedMs)} / {formatTime(totalGameMs)}
              </span>
            </div>

            {/* Button row */}
            <div className="flex items-center justify-center gap-4">
              {/* End game */}
              <div className="relative">
                {confirmEnd ? (
                  <div className="flex items-center gap-2 bg-surface-lighter rounded-full px-3 py-1.5">
                    <span className="text-xs text-text-secondary whitespace-nowrap">End game?</span>
                    <button
                      onClick={() => { onEndGame(); setConfirmEnd(false); }}
                      className="text-xs font-semibold text-neon-pink hover:text-neon-pink/80 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmEnd(false)}
                      className="text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmEnd(true)}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="End game"
                  >
                    {/* Stop square icon */}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="12" height="12" rx="2" fill="#8888a0" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Play/Pause */}
              <button
                onClick={isPaused ? onResume : onPause}
                className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-sm transition-colors flex items-center justify-center"
                aria-label={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? (
                  // Play triangle
                  <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
                    <path d="M2 1.5L20.5 13L2 24.5V1.5Z" fill="#f0f0f5" />
                  </svg>
                ) : (
                  // Pause bars
                  <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                    <rect x="2" y="2" width="5" height="20" rx="1.5" fill="#f0f0f5" />
                    <rect x="13" y="2" width="5" height="20" rx="1.5" fill="#f0f0f5" />
                  </svg>
                )}
              </button>

              {/* Skip */}
              <button
                onClick={onSkip}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
                aria-label="Skip track"
              >
                {/* Next track icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L12 9L2 16V2Z" fill="#8888a0" />
                  <rect x="13" y="2" width="3" height="14" rx="1" fill="#8888a0" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
