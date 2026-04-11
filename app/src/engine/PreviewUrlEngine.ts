import type { Track } from '../types/game';
import type { PlaybackEngine } from './PlaybackEngine';

/**
 * Free-tier playback engine.
 * Fetches Spotify 30-second preview MP3s and plays them through the
 * Web Audio API, exposing an AnalyserNode for the visualizer.
 */
export class PreviewUrlEngine implements PlaybackEngine {
  private context: AudioContext;
  private gainNode: GainNode;
  private analyserNode: AnalyserNode;

  private buffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;

  /** AudioContext.currentTime when play() was called. */
  private playStartContextTime = 0;
  /** The offset (in seconds) into the buffer where we began / will resume. */
  private playOffset = 0;
  /** Whether we are currently paused. */
  private paused = false;
  /** Whether any source is actively playing. */
  private playing = false;

  constructor() {
    this.context = new AudioContext();
    this.gainNode = this.context.createGain();
    this.analyserNode = this.context.createAnalyser();
    this.analyserNode.fftSize = 256;

    // Chain: source -> analyser -> gain -> destination
    this.analyserNode.connect(this.gainNode);
    this.gainNode.connect(this.context.destination);
  }

  // ---------- PlaybackEngine interface ----------

  async loadTrack(track: Track, startPositionMs: number): Promise<void> {
    // Stop anything currently playing
    this.stopSource();

    if (!track.previewUrl) {
      // No preview available — clear the buffer so play() becomes a no-op
      this.buffer = null;
      return;
    }

    const response = await fetch(track.previewUrl);
    const arrayBuffer = await response.arrayBuffer();
    this.buffer = await this.context.decodeAudioData(arrayBuffer);

    // Clamp the start offset to the buffer length
    const maxOffsetSec = this.buffer.duration;
    this.playOffset = Math.min(startPositionMs / 1000, maxOffsetSec);
  }

  async play(): Promise<void> {
    if (!this.buffer) return;

    // Ensure the AudioContext is running (browsers require user-gesture resume)
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.createAndStartSource(this.playOffset);
    this.paused = false;
    this.playing = true;
  }

  async pause(): Promise<void> {
    if (!this.playing || this.paused) return;

    // Record where we are so we can resume from the same spot
    this.playOffset += this.context.currentTime - this.playStartContextTime;
    this.stopSource();
    this.paused = true;
    this.playing = false;
  }

  async resume(): Promise<void> {
    if (!this.paused || !this.buffer) return;

    if (this.context.state === 'suspended') {
      await this.context.resume();
    }

    this.createAndStartSource(this.playOffset);
    this.paused = false;
    this.playing = true;
  }

  async setVolume(level: number): Promise<void> {
    // Clamp to [0, 1]
    this.gainNode.gain.value = Math.max(0, Math.min(1, level));
  }

  getCurrentPositionMs(): number {
    if (!this.buffer) return 0;
    if (this.paused) {
      return this.playOffset * 1000;
    }
    if (!this.playing) return 0;
    const elapsed = this.context.currentTime - this.playStartContextTime;
    return (this.playOffset + elapsed) * 1000;
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  dispose(): void {
    this.stopSource();
    this.gainNode.disconnect();
    this.analyserNode.disconnect();
    void this.context.close();
  }

  // ---------- Internal helpers ----------

  /**
   * Create a new AudioBufferSourceNode, connect it, and start playback
   * from `offsetSec` into the loaded buffer.
   */
  private createAndStartSource(offsetSec: number): void {
    if (!this.buffer) return;

    const source = this.context.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.analyserNode);

    source.onended = () => {
      // Only mark as not-playing if this source is still the active one
      if (this.sourceNode === source) {
        this.playing = false;
      }
    };

    this.sourceNode = source;
    this.playStartContextTime = this.context.currentTime;
    source.start(0, offsetSec);
  }

  /** Disconnect and stop the current source node, if any. */
  private stopSource(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
      } catch {
        // Already stopped — ignore
      }
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }
}
