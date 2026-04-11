// Type declarations for the Spotify Web Playback SDK
// See: https://developer.spotify.com/documentation/web-playback-sdk/reference

declare namespace Spotify {
  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'ready', callback: (data: { device_id: string }) => void): void;
    addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): void;
    addListener(event: 'player_state_changed', callback: (state: PlaybackState | null) => void): void;
    addListener(event: 'initialization_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'authentication_error', callback: (data: { message: string }) => void): void;
    addListener(event: 'account_error', callback: (data: { message: string }) => void): void;
    removeListener(event: string, callback?: (...args: unknown[]) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
  }

  interface PlaybackState {
    context: { uri: string; metadata: Record<string, string> };
    disallows: Record<string, boolean>;
    paused: boolean;
    position: number;
    duration: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    uri: string;
    id: string;
    type: string;
    media_type: string;
    name: string;
    is_playable: boolean;
    album: { uri: string; name: string; images: Array<{ url: string }> };
    artists: Array<{ uri: string; name: string }>;
  }

  interface PlayerOptions {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class Player {
    constructor(options: PlayerOptions);
  }
}
