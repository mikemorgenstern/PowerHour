import { useRef, useEffect, useCallback } from 'react';
import { PreviewUrlEngine } from '../engine/PreviewUrlEngine';
import type { PlaybackEngine } from '../engine/PlaybackEngine';
import { useGameStore } from '../stores/gameStore';

interface UsePlaybackResult {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  skip: () => void;
  setVolume: (level: number) => Promise<void>;
  analyserNode: AnalyserNode | null;
}

/**
 * Bridges the PlaybackEngine to the game store.
 *
 * Initialises the correct engine (currently always PreviewUrlEngine),
 * watches for track changes, and exposes playback controls.
 */
export function usePlayback(): UsePlaybackResult {
  const engineRef = useRef<PlaybackEngine | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Selectors — only re-render when these specific values change
  const currentTrackIndex = useGameStore((s) => s.currentTrackIndex);
  const tracks = useGameStore((s) => s.tracks);
  const status = useGameStore((s) => s.status);

  // Lazily initialise the engine once
  const getEngine = useCallback((): PlaybackEngine => {
    if (!engineRef.current) {
      const engine = new PreviewUrlEngine();
      engineRef.current = engine;
      analyserRef.current = engine.getAnalyserNode();
    }
    return engineRef.current;
  }, []);

  // When the track index changes while the game is playing, load & play the new track
  useEffect(() => {
    if (status !== 'playing' && status !== 'countdown') return;
    const track = tracks[currentTrackIndex];
    if (!track) return;

    const engine = getEngine();

    let cancelled = false;
    (async () => {
      try {
        await engine.loadTrack(track, track.clipStartMs);
        if (cancelled) return;
        await engine.play();
      } catch {
        // loadTrack can fail if the preview URL is unavailable — silently skip
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackIndex, status, tracks, getEngine]);

  // When the game pauses/resumes, mirror that to the engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (status === 'paused') {
      void engine.pause();
    } else if (status === 'playing') {
      // The playing state can be entered from paused (resume) or from
      // a new track load. The track-change effect above handles new loads,
      // so we only resume here if we were previously paused and the engine
      // already has audio loaded.
      // Note: a fresh play() after loadTrack is handled in the above effect.
    }
  }, [status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      analyserRef.current = null;
    };
  }, []);

  const play = useCallback(async () => {
    await getEngine().play();
  }, [getEngine]);

  const pause = useCallback(async () => {
    await getEngine().pause();
  }, [getEngine]);

  const resume = useCallback(async () => {
    await getEngine().resume();
  }, [getEngine]);

  const skip = useCallback(() => {
    useGameStore.getState().skipTrack();
  }, []);

  const setVolume = useCallback(
    async (level: number) => {
      await getEngine().setVolume(level);
    },
    [getEngine],
  );

  return {
    play,
    pause,
    resume,
    skip,
    setVolume,
    analyserNode: analyserRef.current,
  };
}
