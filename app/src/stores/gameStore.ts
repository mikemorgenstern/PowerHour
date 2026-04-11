import { create } from 'zustand';
import type {
  GameState,
  GameSettings,
  GameStats,
  Track,
  ChallengeCard,
  PlayedTrack,
} from '../types/game';
import { DEFAULT_SETTINGS } from '../types/game';

interface GameActions {
  setTracks: (tracks: Track[]) => void;
  startCountdown: () => void;
  startGame: () => void;
  tick: (deltaMs: number) => void;
  beginTransition: () => void;
  completeTransition: () => void;
  pause: () => void;
  resume: () => void;
  skipTrack: () => void;
  endGame: () => void;
  setChallenge: (card: ChallengeCard | null) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  reset: () => void;
  getStats: () => GameStats;
}

const initialState: GameState = {
  status: 'idle',
  tracks: [],
  currentTrackIndex: 0,
  round: 0,
  elapsedMs: 0,
  totalElapsedMs: 0,
  settings: DEFAULT_SETTINGS,
  history: [],
  activeChallenge: null,
  isPremium: false,
};

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  ...initialState,

  setTracks: (tracks: Track[]) =>
    set({
      tracks,
      status: 'ready',
      currentTrackIndex: 0,
      round: 0,
      elapsedMs: 0,
      totalElapsedMs: 0,
      history: [],
      activeChallenge: null,
    }),

  startCountdown: () =>
    set({ status: 'countdown' }),

  startGame: () => {
    const { tracks, currentTrackIndex } = get();
    const currentTrack = tracks[currentTrackIndex];
    const entry: PlayedTrack = {
      track: currentTrack,
      round: 1,
      startedAt: Date.now(),
    };
    set({
      status: 'playing',
      round: 1,
      elapsedMs: 0,
      totalElapsedMs: 0,
      history: [entry],
    });
  },

  tick: (deltaMs: number) => {
    const { status } = get();
    if (status !== 'playing') return;
    set((state) => ({
      elapsedMs: state.elapsedMs + deltaMs,
      totalElapsedMs: state.totalElapsedMs + deltaMs,
    }));
  },

  beginTransition: () =>
    set({ status: 'transition' }),

  completeTransition: () => {
    const { currentTrackIndex, round, tracks, settings } = get();
    const nextIndex = currentTrackIndex + 1;

    // If we've played all tracks or hit the round limit, end the game
    if (nextIndex >= tracks.length || round >= settings.totalRounds) {
      get().endGame();
      return;
    }

    const nextTrack = tracks[nextIndex];
    const nextRound = round + 1;
    const entry: PlayedTrack = {
      track: nextTrack,
      round: nextRound,
      startedAt: Date.now(),
    };

    set((state) => ({
      status: 'playing',
      currentTrackIndex: nextIndex,
      round: nextRound,
      elapsedMs: 0,
      history: [...state.history, entry],
    }));
  },

  pause: () => {
    const { status } = get();
    if (status === 'playing') {
      set({ status: 'paused' });
    }
  },

  resume: () => {
    const { status } = get();
    if (status === 'paused') {
      set({ status: 'playing' });
    }
  },

  skipTrack: () => {
    const { status } = get();
    if (status === 'playing' || status === 'paused') {
      get().beginTransition();
    }
  },

  endGame: () =>
    set({ status: 'complete', activeChallenge: null }),

  setChallenge: (card: ChallengeCard | null) =>
    set({ activeChallenge: card }),

  updateSettings: (partial: Partial<GameSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),

  reset: () =>
    set({ ...initialState }),

  getStats: (): GameStats => {
    const { history, totalElapsedMs, settings } = get();

    // Count unique artists and find the top one
    const artistCounts = new Map<string, number>();
    for (const entry of history) {
      const artist = entry.track.artist;
      artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
    }

    let topArtist = 'N/A';
    let topArtistCount = 0;
    for (const [artist, count] of artistCounts) {
      if (count > topArtistCount) {
        topArtist = artist;
        topArtistCount = count;
      }
    }

    // Count how many challenge rounds occurred
    const { challengeCardsEnabled, challengeFrequency } = settings;
    let challengesShown = 0;
    if (challengeCardsEnabled && challengeFrequency > 0) {
      for (const entry of history) {
        if (entry.round % challengeFrequency === 0) {
          challengesShown++;
        }
      }
    }

    const completionPercent =
      settings.totalRounds > 0
        ? Math.round((history.length / settings.totalRounds) * 100)
        : 0;

    return {
      totalRounds: history.length,
      totalTimeMs: totalElapsedMs,
      uniqueArtists: artistCounts.size,
      topArtist,
      topGenre: 'N/A', // Genre data not available from Track type
      challengesShown,
      completionPercent: Math.min(completionPercent, 100),
    };
  },
}));
