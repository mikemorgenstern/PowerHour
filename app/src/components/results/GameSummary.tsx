import { useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import { useAccentColor } from '../../hooks/useAccentColor';
import { formatTime } from '../../utils/formatTime';
import type { GameStats, PlayedTrack } from '../../types/game';
import TrackHistory from './TrackHistory';

// ---------------------------------------------------------------------------
// Confetti canvas — inline particle system, runs for ~4 seconds then stops
// ---------------------------------------------------------------------------

const CONFETTI_COUNT = 160;
const CONFETTI_DURATION_MS = 4000;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

function spawnConfetti(
  canvas: HTMLCanvasElement,
  accentColors: string[],
): (() => void) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: -10 - Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 6 + 3,
      color: accentColors[Math.floor(Math.random() * accentColors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    });
  }

  const startTime = performance.now();
  let rafId = 0;
  let stopped = false;

  function draw(now: number) {
    if (stopped) return;
    const elapsed = now - startTime;

    ctx!.clearRect(0, 0, w, h);

    // After CONFETTI_DURATION_MS start fading out
    const fadeStart = CONFETTI_DURATION_MS * 0.65;
    const globalAlpha =
      elapsed > fadeStart
        ? Math.max(0, 1 - (elapsed - fadeStart) / (CONFETTI_DURATION_MS - fadeStart))
        : 1;

    for (const p of particles) {
      p.x += p.vx;
      p.vy += 0.04; // gravity
      p.y += p.vy;
      p.vx *= 0.999; // air resistance
      p.rotation += p.rotationSpeed;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.globalAlpha = globalAlpha * p.opacity;
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.4);
      ctx!.restore();
    }

    if (elapsed < CONFETTI_DURATION_MS) {
      rafId = requestAnimationFrame(draw);
    } else {
      ctx!.clearRect(0, 0, w, h);
    }
  }

  rafId = requestAnimationFrame(draw);

  return () => {
    stopped = true;
    cancelAnimationFrame(rafId);
  };
}

// ---------------------------------------------------------------------------
// Progress ring SVG
// ---------------------------------------------------------------------------

function ProgressRing({
  percent,
  size = 80,
  strokeWidth = 6,
  color,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={strokeWidth}
      />
      {/* Filled arc */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, delay: 0.6, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Share recap image generator
// ---------------------------------------------------------------------------

async function generateShareImage(
  stats: GameStats,
  history: PlayedTrack[],
): Promise<Blob | null> {
  const CARD_W = 1080;
  const CARD_H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
  bg.addColorStop(0, '#0a0a1a');
  bg.addColorStop(0.5, '#12122a');
  bg.addColorStop(1, '#0a0a1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Power Hour Complete!', CARD_W / 2, 100);

  // Accent line
  const lineGrad = ctx.createLinearGradient(200, 130, CARD_W - 200, 130);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.2, '#ff2d8a');
  lineGrad.addColorStop(0.5, '#b44aff');
  lineGrad.addColorStop(0.8, '#00d4ff');
  lineGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = lineGrad;
  ctx.fillRect(200, 125, CARD_W - 400, 3);

  // Stats section
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#f0f0f5';

  const statsEntries = [
    ['Rounds', `${stats.totalRounds}`],
    ['Duration', formatTime(stats.totalTimeMs)],
    ['Artists', `${stats.uniqueArtists}`],
    ['Top Artist', stats.topArtist],
    ['Completion', `${stats.completionPercent}%`],
  ];

  let sy = 185;
  for (const [label, value] of statsEntries) {
    ctx.fillStyle = '#8888a0';
    ctx.font = '500 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(label, 80, sy);
    ctx.fillStyle = '#f0f0f5';
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
    ctx.fillText(value, 350, sy);
    sy += 44;
  }

  // Album art grid (up to 4x4 = 16 covers)
  const GRID_COLS = 4;
  const GRID_ROWS = 4;
  const ART_SIZE = 200;
  const GAP = 16;
  const gridOriginX = (CARD_W - (GRID_COLS * ART_SIZE + (GRID_COLS - 1) * GAP)) / 2;
  const gridOriginY = sy + 40;

  // Collect unique album art URLs
  const seenUrls = new Set<string>();
  const artUrls: string[] = [];
  for (const entry of history) {
    const url = entry.track.albumArt;
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      artUrls.push(url);
      if (artUrls.length >= GRID_COLS * GRID_ROWS) break;
    }
  }

  // Load images
  const loadImage = (url: string): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const images = await Promise.all(artUrls.map(loadImage));

  let idx = 0;
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const img = images[idx];
      const x = gridOriginX + col * (ART_SIZE + GAP);
      const y = gridOriginY + row * (ART_SIZE + GAP);

      if (img) {
        // Rounded rect clip
        ctx.save();
        roundedRect(ctx, x, y, ART_SIZE, ART_SIZE, 12);
        ctx.clip();
        ctx.drawImage(img, x, y, ART_SIZE, ART_SIZE);
        ctx.restore();
      } else {
        // Placeholder
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        roundedRect(ctx, x, y, ART_SIZE, ART_SIZE, 12);
        ctx.fill();
      }

      idx++;
      if (idx >= images.length) break;
    }
    if (idx >= images.length) break;
  }

  // Footer branding
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8888a0';
  ctx.font = '500 24px system-ui, -apple-system, sans-serif';
  ctx.fillText('powerhour.app', CARD_W / 2, CARD_H - 40);

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Stat card sub-component
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  index,
  accentColor,
}: {
  label: string;
  value: string | number;
  index: number;
  accentColor: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1 rounded-xl border border-white/5 bg-surface-light/60 px-5 py-4 backdrop-blur-sm"
      style={{ boxShadow: `0 0 20px ${accentColor}15` }}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.4 + index * 0.1, duration: 0.5, ease: 'easeOut' }}
    >
      <span className="text-2xl font-black text-text-primary">{value}</span>
      <span className="text-xs font-medium tracking-wider text-text-secondary uppercase">
        {label}
      </span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function GameSummary() {
  const navigate = useNavigate();
  const onPlayAgain = () => navigate('/select');
  const onNewPlaylist = () => { useGameStore.getState().reset(); navigate('/select'); };
  const confettiRef = useRef<HTMLCanvasElement>(null);
  const history = useGameStore((s) => s.history);
  const getStats = useGameStore((s) => s.getStats);
  const stats = getStats();

  // Accent color from the last track played
  const lastTrack = history.length > 0 ? history[history.length - 1].track : null;
  const { cssColor, glowColor } = useAccentColor(lastTrack?.albumArt);

  // Fire confetti on mount
  useEffect(() => {
    if (!confettiRef.current) return;

    const neonColors = [
      '#ff2d8a', // neon-pink
      '#00d4ff', // neon-blue
      '#39ff14', // neon-green
      '#b44aff', // neon-purple
      '#ffe600', // neon-yellow
      cssColor,  // accent from last track
    ];

    const cleanup = spawnConfetti(confettiRef.current, neonColors);
    return cleanup;
  }, [cssColor]);

  // Share handler
  const handleShare = useCallback(async () => {
    const blob = await generateShareImage(stats, history);
    if (!blob) return;

    const file = new File([blob], 'power-hour-recap.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Power Hour Recap',
          text: `I just survived a ${stats.totalRounds}-round Power Hour!`,
          files: [file],
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to download
      }
    }

    // Fallback: download the image
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'power-hour-recap.png';
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, history]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center overflow-hidden bg-surface px-4 pb-16 pt-8">
      {/* Confetti canvas — full-screen overlay */}
      <canvas
        ref={confettiRef}
        className="pointer-events-none absolute inset-0 z-50 h-full w-full"
        aria-hidden="true"
      />

      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 50% at 50% 20%, ${glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-col items-center gap-8">
        {/* Title */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h1
            className="text-5xl font-black tracking-tight text-text-primary sm:text-6xl"
            style={{
              textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}`,
            }}
          >
            Power Hour
            <br />
            Complete!
          </h1>
          <motion.p
            className="mt-3 text-lg font-semibold text-neon-blue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {stats.totalRounds} rounds in {formatTime(stats.totalTimeMs)}
          </motion.p>
        </motion.div>

        {/* Stats grid */}
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="Rounds"
            value={stats.totalRounds}
            index={0}
            accentColor={cssColor}
          />
          <StatCard
            label="Duration"
            value={formatTime(stats.totalTimeMs)}
            index={1}
            accentColor={cssColor}
          />
          <StatCard
            label="Artists"
            value={stats.uniqueArtists}
            index={2}
            accentColor={cssColor}
          />
          <StatCard
            label="Top Artist"
            value={stats.topArtist}
            index={3}
            accentColor={cssColor}
          />
          {stats.challengesShown > 0 && (
            <StatCard
              label="Challenges"
              value={stats.challengesShown}
              index={4}
              accentColor={cssColor}
            />
          )}

          {/* Completion cell with ring */}
          <motion.div
            className="col-span-2 flex items-center justify-center gap-4 rounded-xl border border-white/5 bg-surface-light/60 px-5 py-4 backdrop-blur-sm sm:col-span-1"
            style={{ boxShadow: `0 0 20px ${cssColor}15` }}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.5, ease: 'easeOut' }}
          >
            <ProgressRing percent={stats.completionPercent} color={cssColor} />
            <div className="flex flex-col">
              <span className="text-2xl font-black text-text-primary">
                {stats.completionPercent}%
              </span>
              <span className="text-xs font-medium tracking-wider text-text-secondary uppercase">
                Complete
              </span>
            </div>
          </motion.div>
        </div>

        {/* Track history */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <TrackHistory history={history} />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          {/* Share */}
          <motion.button
            onClick={handleShare}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-surface-lighter px-6 py-3.5 text-sm font-bold text-text-primary transition-colors hover:bg-white/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share Recap
          </motion.button>

          {/* Play Again */}
          <motion.button
            onClick={onPlayAgain}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white transition-colors"
            style={{
              background: `linear-gradient(135deg, ${cssColor}, #b44aff)`,
              boxShadow: `0 0 24px ${glowColor}`,
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Play Again
          </motion.button>

          {/* New Playlist */}
          <motion.button
            onClick={onNewPlaylist}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neon-blue/30 bg-transparent px-6 py-3.5 text-sm font-bold text-neon-blue transition-colors hover:bg-neon-blue/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
            New Playlist
          </motion.button>
        </motion.div>

        {/* Bottom accent line */}
        <motion.div
          className="h-1 w-full rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, #ff2d8a, #b44aff, #00d4ff, transparent)',
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
