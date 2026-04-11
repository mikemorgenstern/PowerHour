import { useMemo } from 'react';

interface ProgressRingProps {
  /** 0 = just started, 1 = time's up */
  progress: number;
  accentColor: string;
  /** Seconds remaining in the current round */
  secondsLeft: number;
  /** Outer diameter of the ring in px */
  size?: number;
}

/**
 * Circular countdown ring that depletes over the clip duration.
 * Pulses in the last 10 seconds; shows large countdown digits in the last 5.
 */
export default function ProgressRing({
  progress,
  accentColor,
  secondsLeft,
  size = 340,
}: ProgressRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // progress 0 = full ring, progress 1 = empty ring
  const dashOffset = circumference * progress;

  const isUrgent = secondsLeft <= 10;
  const showDigits = secondsLeft <= 5 && secondsLeft >= 1;
  const displayDigit = Math.ceil(secondsLeft);

  // Pulse speed ramps up in final seconds
  const pulseClass = useMemo(() => {
    if (secondsLeft <= 3) return 'animate-[pulse-ring_0.3s_ease-in-out_infinite]';
    if (secondsLeft <= 5) return 'animate-[pulse-ring_0.5s_ease-in-out_infinite]';
    if (secondsLeft <= 10) return 'animate-[pulse-ring_0.8s_ease-in-out_infinite]';
    return '';
  }, [secondsLeft]);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        className={`absolute inset-0 -rotate-90 ${pulseClass}`}
        style={{
          filter: `drop-shadow(0 0 ${isUrgent ? 16 : 8}px ${accentColor})`,
        }}
      >
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        {/* Foreground arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 0.25s linear',
          }}
        />
      </svg>

      {/* Large countdown digits inside the ring */}
      {showDigits && (
        <span
          key={displayDigit}
          className="absolute text-7xl font-black tabular-nums select-none animate-[digit-pop_0.9s_ease-out]"
          style={{
            color: accentColor,
            textShadow: `0 0 30px ${accentColor}, 0 0 60px ${accentColor}`,
          }}
        >
          {displayDigit}
        </span>
      )}

      {/* Slot for children (album art sits inside the ring) */}
    </div>
  );
}
