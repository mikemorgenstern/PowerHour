import type { PlaybackEngine } from './PlaybackEngine';
import type { ChallengeCard } from '../types/game';
import { useGameStore } from '../stores/gameStore';

type GameStoreApi = typeof useGameStore;

/**
 * Core game loop — drives the round timer, transitions between tracks,
 * crossfades audio, and fires challenge cards.
 *
 * This is a plain TypeScript class, not a React component.
 * Instantiate it once and call start() / stop().
 */
export class GameLoop {
  private engine: PlaybackEngine;
  private store: GameStoreApi;
  private onTransition: (() => void) | null;

  private rafId: number | null = null;
  private lastTimestamp: number | null = null;
  private transitioning = false;

  constructor(
    engine: PlaybackEngine,
    store: GameStoreApi = useGameStore,
    onTransition: (() => void) | null = null,
  ) {
    this.engine = engine;
    this.store = store;
    this.onTransition = onTransition;
  }

  /** Kick off the requestAnimationFrame loop. */
  start(): void {
    if (this.rafId !== null) return; // Already running
    this.lastTimestamp = null;
    this.transitioning = false;
    this.rafLoop(performance.now());
  }

  /** Stop the loop entirely. */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastTimestamp = null;
  }

  // ---------- Internal ----------

  private rafLoop = (timestamp: number): void => {
    const state = this.store.getState();

    // If the game is complete or idle, stop looping
    if (state.status === 'complete' || state.status === 'idle') {
      this.stop();
      return;
    }

    // Only tick when actually playing
    if (state.status === 'playing' && this.lastTimestamp !== null) {
      const delta = timestamp - this.lastTimestamp;
      state.tick(delta);

      // Check if the round is over
      const clipDurationMs = state.settings.clipDurationSec * 1000;
      // Re-read elapsedMs after tick
      const updatedElapsed = this.store.getState().elapsedMs;
      if (updatedElapsed >= clipDurationMs && !this.transitioning) {
        this.runTransition();
      }
    }

    // When paused, keep the RAF alive but don't advance time.
    // Reset lastTimestamp so the next playing frame has a clean delta.
    if (state.status === 'paused') {
      this.lastTimestamp = null;
    } else {
      this.lastTimestamp = timestamp;
    }

    this.rafId = requestAnimationFrame(this.rafLoop);
  };

  /**
   * Orchestrate the transition between tracks:
   * 1. Fade out current track
   * 2. Load next track
   * 3. Fade in next track
   * 4. Fire challenge card if applicable
   */
  private async runTransition(): Promise<void> {
    this.transitioning = true;
    const state = this.store.getState();
    const { settings, currentTrackIndex, tracks, round } = state;

    // Signal the store
    state.beginTransition();

    // Notify external listener (e.g., to play a transition sound)
    this.onTransition?.();

    const crossfadeMs = settings.crossfadeDurationMs;

    // --- Fade out current track ---
    await this.fadeVolume(1, 0, crossfadeMs);
    await this.engine.pause();

    // --- Determine next track ---
    const nextIndex = currentTrackIndex + 1;
    if (nextIndex >= tracks.length || round >= settings.totalRounds) {
      state.endGame();
      this.transitioning = false;
      return;
    }

    const nextTrack = tracks[nextIndex];

    // --- Load & start next track ---
    await this.engine.loadTrack(nextTrack, nextTrack.clipStartMs);
    await this.engine.setVolume(0);
    await this.engine.play();

    // --- Fade in ---
    await this.fadeVolume(0, 1, crossfadeMs);

    // Advance the store state
    state.completeTransition();

    // --- Challenge card check ---
    const nextRound = this.store.getState().round;
    if (
      settings.challengeCardsEnabled &&
      settings.challengeFrequency > 0 &&
      nextRound % settings.challengeFrequency === 0
    ) {
      this.emitChallengeCard(nextRound);
    }

    this.transitioning = false;
  }

  /**
   * Smoothly ramp the engine volume from `from` to `to`
   * over `durationMs` using small steps.
   */
  private fadeVolume(from: number, to: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = 20;
      const stepMs = durationMs / steps;
      const delta = (to - from) / steps;
      let current = from;
      let step = 0;

      const interval = setInterval(() => {
        step++;
        current += delta;
        void this.engine.setVolume(Math.max(0, Math.min(1, current)));
        if (step >= steps) {
          clearInterval(interval);
          void this.engine.setVolume(to);
          resolve();
        }
      }, stepMs);
    });
  }

  /**
   * Pick a challenge card and push it into the store.
   * This is a placeholder — a real implementation would draw from a deck.
   */
  private emitChallengeCard(round: number): void {
    const card: ChallengeCard = {
      id: `challenge-${round}`,
      text: 'Take a sip!',
      category: 'drinking',
      intensity: 1,
    };
    this.store.getState().setChallenge(card);
  }
}
