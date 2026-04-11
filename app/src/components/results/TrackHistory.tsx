import { motion } from 'framer-motion';
import type { PlayedTrack } from '../../types/game';

interface TrackHistoryProps {
  history: PlayedTrack[];
}

const ROW_VARIANTS = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, duration: 0.35, ease: 'easeOut' as const },
  }),
};

/**
 * Scrollable list of all tracks played during the Power Hour.
 * Each row shows a small album art thumbnail, track name, artist, and round number.
 */
export default function TrackHistory({ history }: TrackHistoryProps) {
  return (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-bold tracking-wide text-text-primary">
        Track History
      </h3>

      <div className="max-h-[400px] overflow-y-auto rounded-xl border border-white/5 bg-surface-light/50 backdrop-blur-sm">
        {history.map((entry, i) => (
          <motion.div
            key={`${entry.track.id}-${entry.round}`}
            className={`flex items-center gap-3 px-4 py-3 ${
              i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
            } ${i !== history.length - 1 ? 'border-b border-white/5' : ''}`}
            variants={ROW_VARIANTS}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            {/* Round number */}
            <span className="w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-text-secondary">
              {entry.round}
            </span>

            {/* Album art thumbnail */}
            <img
              src={entry.track.albumArtSmall || entry.track.albumArt}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md object-cover shadow-md"
              loading="lazy"
            />

            {/* Track info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">
                {entry.track.name}
              </p>
              <p className="truncate text-xs text-text-secondary">
                {entry.track.artist}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
