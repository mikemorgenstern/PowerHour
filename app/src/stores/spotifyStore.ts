import { create } from 'zustand';

interface SpotifyProfile {
  userId: string;
  displayName: string;
  isPremium: boolean;
}

interface SpotifyState {
  accessToken: string | null;
  isPremium: boolean;
  userId: string | null;
  displayName: string | null;
  deviceId: string | null;
}

interface SpotifyActions {
  setToken: (token: string) => void;
  setProfile: (profile: SpotifyProfile) => void;
  setDeviceId: (id: string) => void;
  logout: () => void;
}

const initialState: SpotifyState = {
  accessToken: null,
  isPremium: false,
  userId: null,
  displayName: null,
  deviceId: null,
};

export const useSpotifyStore = create<SpotifyState & SpotifyActions>()(
  (set) => ({
    ...initialState,

    setToken: (token: string) =>
      set({ accessToken: token }),

    setProfile: (profile: SpotifyProfile) =>
      set({
        userId: profile.userId,
        displayName: profile.displayName,
        isPremium: profile.isPremium,
      }),

    setDeviceId: (id: string) =>
      set({ deviceId: id }),

    logout: () =>
      set({ ...initialState }),
  }),
);
