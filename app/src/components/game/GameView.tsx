import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { SpotifySDKEngine } from '../../engine/SpotifySDKEngine';
import { GameLoop } from '../../engine/GameLoop';
import type { PlaybackEngine } from '../../engine/PlaybackEngine';
import { extractDominantColor, vibrateColor } from '../../utils/colors';

import PreGameCountdown from './PreGameCountdown';
import NowPlaying from './NowPlaying';
import ProgressRing from './ProgressRing';
import TransitionOverlay from './TransitionOverlay';
import GameControls from './GameControls';
import Visualizer from './Visualizer';

/**
 * Main game play screen. Manages the PlaybackEngine + GameLoop lifecycle,
 * renders all sub-components, and handles keyboard shortcuts.
 */
export default function GameView() {
  const navigate = useNavigate();

  // --- Store selectors ---
  const status = useGameStore((s) => s.status);
  const tracks = useGameStore((s) => s.tracks);
  const currentTrackIndex = useGameStore((s) => s.currentTrackIndex);
  const round = useGameStore((s) => s.round);
  const elapsedMs = useGameStore((s) => s.elapsedMs);
  const totalElapsedMs = useGameStore((s) => s.totalElapsedMs);
  const settings = useGameStore((s) => s.settings);
  const activeChallenge = useGameStore((s) => s.activeChallenge);

  const pause = useGameStore((s) => s.pause);
  const resume = useGameStore((s) => s.resume);
  const skipTrack = useGameStore((s) => s.skipTrack);
  const endGame = useGameStore((s) => s.endGame);
  const startCountdown = useGameStore((s) => s.startCountdown);

  // --- Refs for engine + loop (non-reactive) ---
  const engineRef = useRef<PlaybackEngine | null>(null);
  const loopRef = useRef<GameLoop | null>(null);

  // --- Local UI state ---
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const [accentColor, setAccentColor] = useState('rgb(180, 74, 255)'); // Default neon-purple

  const currentTrack = tracks[currentTrackIndex] ?? null;

  // --- Initialize engine + loop on mount ---
  useEffect(() => {
    // Always use Spotify SDK — preview URLs are no longer available in Dev Mode.
    // Falls back to PreviewUrl engine only if explicitly not Premium.
    const engine = new SpotifySDKEngine();
    engineRef.current = engine;
    setAnalyserNode(engine.getAnalyserNode());

    const loop = new GameLoop(engine, useGameStore);
    loopRef.current = loop;

    // If tracks are loaded and we're in 'ready', kick off the countdown
    const state = useGameStore.getState();
    if (state.status === 'ready' && state.tracks.length > 0) {
      startCountdown();
    }

    return () => {
      loop.stop();
      engine.dispose();
      engineRef.current = null;
      loopRef.current = null;
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- When game transitions from countdown to playing, load + play first track ---
  useEffect(() => {
    const engine = engineRef.current;
    const loop = loopRef.current;
    if (!engine || !loop) return;

    if (status === 'playing' && round === 1) {
      const track = tracks[0];
      if (track) {
        void (async () => {
          await engine.loadTrack(track, track.clipStartMs);
          await engine.setVolume(1);
          await engine.play();
          loop.start();
        })();
      }
    }
  }, [status, round, tracks]);

  // --- Pause / resume audio to match store status ---
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (status === 'paused') {
      void engine.pause();
    } else if (status === 'playing') {
      // Resume audio when un-pausing (GameLoop handles the RAF already)
      void engine.resume();
    }
  }, [status]);

  // --- Redirect on game complete ---
  useEffect(() => {
    if (status === 'complete') {
      navigate('/results');
    }
  }, [status, navigate]);

  // --- Extract accent color from current album art ---
  useEffect(() => {
    if (!currentTrack) return;
    let cancelled = false;

    extractDominantColor(currentTrack.albumArt).then(([r, g, b]) => {
      if (cancelled) return;
      const [vr, vg, vb] = vibrateColor(r, g, b, 1.6);
      const color = `rgb(${vr}, ${vg}, ${vb})`;
      setAccentColor(color);

      // Update CSS custom property so children can use it
      document.documentElement.style.setProperty('--accent-r', String(vr));
      document.documentElement.style.setProperty('--accent-g', String(vg));
      document.documentElement.style.setProperty('--accent-b', String(vb));
      document.documentElement.style.setProperty('--accent-color', color);
    });

    return () => { cancelled = true; };
  }, [currentTrack]);

  // --- Keyboard shortcuts ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (status === 'playing') pause();
        else if (status === 'paused') resume();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (status === 'playing' || status === 'paused') skipTrack();
      }
    },
    [status, pause, resume, skipTrack],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // --- Derived values ---
  const clipDurationSec = settings.clipDurationSec;
  const progress = Math.min(elapsedMs / (clipDurationSec * 1000), 1);
  const secondsLeft = Math.max(clipDurationSec - elapsedMs / 1000, 0);

  // --- Render ---

  // Countdown phase
  if (status === 'countdown') {
    return <PreGameCountdown />;
  }

  // Guard: nothing to show if idle or no tracks
  if (!currentTrack) {
    return null;
  }

  const isPaused = status === 'paused';

  return (
    <div className="fixed inset-0 bg-surface overflow-hidden select-none flex flex-col items-center justify-center">
      {/* Ambient background glow keyed to accent color */}
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, ${accentColor}18 0%, transparent 70%)`,
        }}
      />

      {/* Visualizer canvas (behind everything) */}
      {settings.visualizerEnabled && (
        <Visualizer
          analyserNode={analyserNode}
          accentColor={accentColor}
          innerRadius={170}
        />
      )}

      {/* Center stage: ring + art + info */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Progress ring wrapping album art */}
        <div className="relative flex items-center justify-center">
          <ProgressRing
            progress={progress}
            accentColor={accentColor}
            secondsLeft={secondsLeft}
            size={340}
          />
          {/* Album art sits inside the ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <NowPlaying
              track={currentTrack}
              accentColor={accentColor}
              trackIndex={currentTrackIndex}
            />
          </div>
        </div>
      </div>

      {/* Transition overlay */}
      <TransitionOverlay
        visible={status === 'transition'}
        round={round}
        activeChallenge={activeChallenge}
        accentColor={accentColor}
      />

      {/* Pause overlay */}
      {isPaused && (
        <div className="fixed inset-0 z-20 bg-surface/60 backdrop-blur-sm flex items-center justify-center">
          <p className="text-4xl font-bold text-text-primary/80">Paused</p>
        </div>
      )}

      {/* Controls */}
      <GameControls
        isPaused={isPaused}
        round={round}
        totalRounds={settings.totalRounds}
        totalElapsedMs={totalElapsedMs}
        clipDurationSec={clipDurationSec}
        onPause={pause}
        onResume={resume}
        onSkip={skipTrack}
        onEndGame={endGame}
      />
    </div>
  );
}
