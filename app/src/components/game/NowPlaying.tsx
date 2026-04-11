import { AnimatePresence, motion } from 'framer-motion';
import type { Track } from '../../types/game';

interface NowPlayingProps {
  track: Track;
  accentColor: string;
  trackIndex: number;
}

/**
 * Displays the current track's album art, song name, and artist.
 * Crossfades between tracks using AnimatePresence keyed on trackIndex.
 */
export default function NowPlaying({ track, accentColor, trackIndex }: NowPlayingProps) {
  return (
    <div className="flex flex-col items-center gap-5 relative">
      {/* Album art with float + glow */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`art-${trackIndex}`}
          initial={{ opacity: 0, x: 80, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -80, scale: 0.92 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="relative"
        >
          <img
            src={track.albumArt}
            alt={`${track.albumName} album art`}
            className="w-52 h-52 sm:w-64 sm:h-64 md:w-72 md:h-72 rounded-2xl object-cover animate-[float_4s_ease-in-out_infinite]"
            style={{
              boxShadow: `0 0 40px 8px ${accentColor}44, 0 0 80px 20px ${accentColor}22`,
            }}
            crossOrigin="anonymous"
          />
        </motion.div>
      </AnimatePresence>

      {/* Track info */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`info-${trackIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeInOut', delay: 0.1 }}
          className="text-center px-4 max-w-md"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary truncate">
            {track.name}
          </h2>
          <p className="text-base sm:text-lg text-text-secondary mt-1 truncate">
            {track.artist}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
