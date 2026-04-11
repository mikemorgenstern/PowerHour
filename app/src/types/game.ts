export interface Track {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumArt: string; // URL to largest album art
  albumArtSmall: string; // URL to small album art (64px)
  durationMs: number;
  previewUrl: string | null;
  uri: string;
  clipStartMs: number; // Where to start playing (smart clip selection)
  energy?: number; // From audio features, 0-1
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  imageUrl: string;
  trackCount: number;
  owner: string;
  ownerId: string; // Spotify account ID of the playlist owner
}

export interface GameSettings {
  clipDurationSec: number; // Default 60
  totalRounds: number; // Default 60
  crossfadeDurationMs: number; // Default 1500
  transitionSound: TransitionSound;
  challengeCardsEnabled: boolean;
  challengeFrequency: number; // Every N rounds (e.g., 5)
  visualizerEnabled: boolean;
}

export type TransitionSound = 'airhorn' | 'bell' | 'vinyl' | 'bass' | 'glass' | 'none';

export type GameStatus =
  | 'idle'
  | 'selecting'
  | 'configuring'
  | 'ready'
  | 'countdown' // Pre-game 5-second countdown
  | 'playing'
  | 'paused'
  | 'transition'
  | 'complete';

export interface GameState {
  status: GameStatus;
  tracks: Track[];
  currentTrackIndex: number;
  round: number;
  elapsedMs: number; // Elapsed within current round
  totalElapsedMs: number; // Total game elapsed
  settings: GameSettings;
  history: PlayedTrack[];
  activeChallenge: ChallengeCard | null;
  isPremium: boolean;
}

export interface PlayedTrack {
  track: Track;
  round: number;
  startedAt: number; // Timestamp
}

export interface ChallengeCard {
  id: string;
  text: string;
  category: 'action' | 'social' | 'drinking' | 'fun';
  intensity: 1 | 2 | 3; // 1 = mild, 3 = wild
}

export interface GameStats {
  totalRounds: number;
  totalTimeMs: number;
  uniqueArtists: number;
  topArtist: string;
  topGenre: string;
  challengesShown: number;
  completionPercent: number;
}

export const DEFAULT_SETTINGS: GameSettings = {
  clipDurationSec: 60,
  totalRounds: 60,
  crossfadeDurationMs: 1500,
  transitionSound: 'airhorn',
  challengeCardsEnabled: true,
  challengeFrequency: 5,
  visualizerEnabled: true,
};
