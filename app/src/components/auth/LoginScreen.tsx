import { motion } from 'framer-motion';
import { redirectToSpotifyAuth } from '../../spotify/auth';

export default function LoginScreen() {
  const handleConnect = async () => {
    await redirectToSpotifyAuth();
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-surface px-4">
      {/* Animated gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(180,74,255,0.15) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)',
          animation: 'bgPulse 8s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes bgPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.08);
          }
        }
      `}</style>

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* Title with neon glow */}
        <motion.h1
          className="text-6xl font-black tracking-tight text-text-primary sm:text-8xl"
          style={{
            textShadow:
              '0 0 20px rgba(255,45,138,0.5), 0 0 60px rgba(255,45,138,0.3), 0 0 100px rgba(255,45,138,0.15)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Power Hour
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-3 text-xl font-semibold tracking-wide text-neon-blue sm:text-2xl"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          The Party Starts Here
        </motion.p>

        {/* Tagline */}
        <motion.p
          className="mt-4 max-w-md text-base leading-relaxed text-text-secondary sm:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          60 songs. 60 seconds each. One epic hour.
          <br />
          Connect your Spotify and let the music do the work.
        </motion.p>

        {/* Spotify connect button */}
        <motion.button
          onClick={handleConnect}
          className="mt-10 flex cursor-pointer items-center gap-3 rounded-full bg-[#1DB954] px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-[#1ed760]"
          style={{
            boxShadow:
              '0 0 20px rgba(29,185,84,0.35), 0 4px 20px rgba(0,0,0,0.4)',
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Spotify icon */}
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Connect with Spotify
        </motion.button>
      </motion.div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-1 w-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, #ff2d8a, #b44aff, #00d4ff, transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, delay: 0.9, ease: 'easeOut' }}
      />
    </div>
  );
}
