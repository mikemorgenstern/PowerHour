import type { Track } from '../types/game';

/**
 * Abstraction over audio playback. Two implementations:
 *  - PreviewUrlEngine  (free tier — uses Web Audio API + 30-second preview URLs)
 *  - SpotifySDKEngine  (premium tier — uses Spotify Web Playback SDK for full tracks)
 */
export interface PlaybackEngine {
  /** Fetch/prepare a track for playback, starting at the given position. */
  loadTrack(track: Track, startPositionMs: number): Promise<void>;

  /** Begin playback of the loaded track. */
  play(): Promise<void>;

  /** Pause playback (keeps position). */
  pause(): Promise<void>;

  /** Resume from where we paused. */
  resume(): Promise<void>;

  /** Set output volume (0 = silent, 1 = full). */
  setVolume(level: number): Promise<void>;

  /** Current playback position in milliseconds. */
  getCurrentPositionMs(): number;

  /** AnalyserNode connected to the audio graph, or null if unavailable. */
  getAnalyserNode(): AnalyserNode | null;

  /** Tear down the engine, releasing all audio resources. */
  dispose(): void;
}
