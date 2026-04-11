import type { Track } from '../types/game';
import type { PlaybackEngine } from './PlaybackEngine';
import { getStoredToken } from '../spotify/auth';
import { fetchWithAuth } from '../spotify/api';

/**
 * Premium-tier playback engine using the Spotify Web Playback SDK.
 * Streams full tracks through Spotify Connect, with an AnalyserNode
 * tapped off the <audio> element for the visualizer.
 */
export class SpotifySDKEngine implements PlaybackEngine {
  private player: Spotify.Player | null = null;
  private deviceId: string | null = null;
  private ready: Promise<void>;
  private resolveReady!: () => void;
  private currentPositionMs = 0;
  private positionPollId: ReturnType<typeof setInterval> | null = null;

  // Audio analysis — we create an AudioContext + AnalyserNode and connect
  // it to the Spotify SDK's audio element (if we can find it).
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;

  constructor() {
    this.ready = new Promise<void>((resolve) => {
      this.resolveReady = resolve;
    });

    this.initSDK();
  }

  private async initSDK(): Promise<void> {
    // Load the Spotify Web Playback SDK script if not already loaded
    if (!(window as unknown as Record<string, unknown>).Spotify) {
      await new Promise<void>((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        (window as unknown as Record<string, () => void>).onSpotifyWebPlaybackSDKReady = () => {
          resolve();
        };
      });
    }

    const token = await getStoredToken();
    if (!token) {
      console.error('[SpotifySDK] No access token available');
      return;
    }

    this.player = new Spotify.Player({
      name: 'Power Hour',
      getOAuthToken: async (cb) => {
        const t = await getStoredToken();
        cb(t || '');
      },
      volume: 1.0,
    });

    this.player.addListener('ready', ({ device_id }) => {
      console.log('[SpotifySDK] Ready with device ID:', device_id);
      this.deviceId = device_id;
      this.resolveReady();
      this.tryConnectAnalyser();
    });

    this.player.addListener('not_ready', ({ device_id }) => {
      console.warn('[SpotifySDK] Device went offline:', device_id);
    });

    this.player.addListener('player_state_changed', (state) => {
      if (state) {
        this.currentPositionMs = state.position;
      }
    });

    this.player.addListener('initialization_error', ({ message }) => {
      console.error('[SpotifySDK] Init error:', message);
    });

    this.player.addListener('authentication_error', ({ message }) => {
      console.error('[SpotifySDK] Auth error:', message);
    });

    this.player.addListener('account_error', ({ message }) => {
      console.error('[SpotifySDK] Account error (Premium required):', message);
    });

    await this.player.connect();

    // Poll position for accurate progress tracking
    this.positionPollId = setInterval(async () => {
      if (!this.player) return;
      const state = await this.player.getCurrentState();
      if (state) {
        this.currentPositionMs = state.position;
      }
    }, 250);
  }

  /**
   * Try to find the SDK's hidden <audio> element and route it through
   * our AnalyserNode for the visualizer.
   */
  private tryConnectAnalyser(): void {
    try {
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;

      // The Spotify SDK creates an <audio> or <video> element internally.
      // Try to find it and connect.
      const audioEl = document.querySelector('audio') || document.querySelector('video');
      if (audioEl) {
        this.mediaSource = this.audioContext.createMediaElementSource(audioEl as HTMLMediaElement);
        this.mediaSource.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
        console.log('[SpotifySDK] Connected AnalyserNode to audio element');
      } else {
        console.warn('[SpotifySDK] No audio element found for analyser — visualizer may not work');
      }
    } catch (e) {
      console.warn('[SpotifySDK] Could not create AnalyserNode:', e);
    }
  }

  // ---------- PlaybackEngine interface ----------

  async loadTrack(track: Track, startPositionMs: number): Promise<void> {
    await this.ready;

    if (!this.deviceId || !this.player) {
      console.error('[SpotifySDK] Not ready — no device ID');
      return;
    }

    // Use the Spotify Web API to start playback on our SDK device
    try {
      await fetchWithAuth(
        `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uris: [track.uri],
            position_ms: startPositionMs,
          }),
        },
      );
    } catch (e) {
      console.error('[SpotifySDK] Failed to start playback:', e);
    }
  }

  async play(): Promise<void> {
    await this.ready;
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    await this.player?.resume();
  }

  async pause(): Promise<void> {
    await this.player?.pause();
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
    await this.player?.resume();
  }

  async setVolume(level: number): Promise<void> {
    await this.player?.setVolume(level);
  }

  getCurrentPositionMs(): number {
    return this.currentPositionMs;
  }

  getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  dispose(): void {
    if (this.positionPollId !== null) {
      clearInterval(this.positionPollId);
    }
    this.player?.disconnect();
    this.player = null;
    this.mediaSource?.disconnect();
    this.analyserNode?.disconnect();
    this.audioContext?.close();
  }
}
