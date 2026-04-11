import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/gameStore';
import type { TransitionSound } from '../../types/game';

// ---------------------------------------------------------------------------
// Transition sound options
// ---------------------------------------------------------------------------

const TRANSITION_SOUNDS: { value: TransitionSound; label: string; emoji: string }[] = [
  { value: 'airhorn', label: 'Airhorn', emoji: '\uD83D\uDCE2' },
  { value: 'bell', label: 'Bell', emoji: '\uD83D\uDD14' },
  { value: 'vinyl', label: 'Vinyl Scratch', emoji: '\uD83C\uDFB5' },
  { value: 'bass', label: 'Bass Drop', emoji: '\uD83D\uDD0A' },
  { value: 'glass', label: 'Glass Clink', emoji: '\uD83E\uDD42' },
  { value: 'none', label: 'None', emoji: '\uD83D\uDD07' },
];

// ---------------------------------------------------------------------------
// Reusable slider component
// ---------------------------------------------------------------------------

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}

function SettingSlider({ label, value, min, max, step = 1, unit = '', onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm font-semibold text-neon-blue">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-lighter accent-neon-blue outline-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-neon-blue [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,212,255,0.5)]"
      />
      <div className="mt-1 flex justify-between text-xs text-text-secondary">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle component
// ---------------------------------------------------------------------------

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center justify-between"
      onClick={() => onChange(!checked)}
    >
      <div>
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
        )}
      </div>
      <div
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-neon-green/80' : 'bg-surface-lighter'
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main GameSettings component
// ---------------------------------------------------------------------------

export default function GameSettings() {
  const navigate = useNavigate();
  const tracks = useGameStore((s) => s.tracks);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const maxRounds = Math.min(tracks.length, 100);

  const handleStart = () => {
    // Limit tracks to totalRounds and shuffle them
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, settings.totalRounds);
    useGameStore.getState().setTracks(selected);
    navigate('/play');
  };

  return (
    <div className="min-h-dvh bg-surface px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/select')}
            className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to playlists
          </button>

          <h1 className="text-3xl font-bold text-text-primary">Game Settings</h1>
          <p className="mt-1 text-text-secondary">
            <span className="font-medium text-neon-purple">{tracks.length}</span>{' '}
            tracks loaded &mdash; fine-tune your session
          </p>
        </motion.div>

        {/* Settings cards */}
        <motion.div
          className="mt-8 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {/* Clip Duration */}
          <div className="rounded-xl bg-surface-light p-5">
            <SettingSlider
              label="Clip Duration"
              value={settings.clipDurationSec}
              min={15}
              max={120}
              step={5}
              unit="s"
              onChange={(v) => updateSettings({ clipDurationSec: v })}
            />
          </div>

          {/* Total Rounds */}
          <div className="rounded-xl bg-surface-light p-5">
            <SettingSlider
              label="Total Rounds"
              value={Math.min(settings.totalRounds, maxRounds)}
              min={1}
              max={maxRounds}
              onChange={(v) => updateSettings({ totalRounds: v })}
            />
          </div>

          {/* Transition Sound */}
          <div className="rounded-xl bg-surface-light p-5">
            <span className="text-sm font-medium text-text-primary">
              Transition Sound
            </span>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {TRANSITION_SOUNDS.map((opt) => {
                const active = settings.transitionSound === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => updateSettings({ transitionSound: opt.value })}
                    className={`cursor-pointer rounded-lg px-3 py-2.5 text-center text-sm font-medium transition-colors ${
                      active
                        ? 'bg-neon-blue/15 text-neon-blue ring-1 ring-neon-blue/40'
                        : 'bg-surface-lighter text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <span className="block text-lg">{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Challenge Cards */}
          <div className="rounded-xl bg-surface-light p-5">
            <Toggle
              label="Challenge Cards"
              description="Show party challenges during the game"
              checked={settings.challengeCardsEnabled}
              onChange={(v) => updateSettings({ challengeCardsEnabled: v })}
            />

            {settings.challengeCardsEnabled && (
              <div className="mt-5 border-t border-surface-lighter pt-4">
                <span className="text-sm font-medium text-text-primary">
                  Challenge Frequency
                </span>
                <div className="mt-3 flex gap-2">
                  {[3, 5, 10].map((n) => {
                    const active = settings.challengeFrequency === n;
                    return (
                      <button
                        key={n}
                        onClick={() => updateSettings({ challengeFrequency: n })}
                        className={`flex-1 cursor-pointer rounded-lg py-2 text-center text-sm font-medium transition-colors ${
                          active
                            ? 'bg-neon-purple/15 text-neon-purple ring-1 ring-neon-purple/40'
                            : 'bg-surface-lighter text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        Every {n}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs text-text-secondary">rounds</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Start button */}
        <motion.div
          className="mt-8 pb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <button
            onClick={handleStart}
            className="w-full cursor-pointer rounded-2xl bg-neon-pink px-6 py-4 text-lg font-bold text-white transition-colors hover:bg-neon-pink/90"
            style={{
              boxShadow:
                '0 0 25px rgba(255,45,138,0.4), 0 0 60px rgba(255,45,138,0.15), 0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            Start Power Hour
          </button>
        </motion.div>
      </div>
    </div>
  );
}
