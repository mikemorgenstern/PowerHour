import { useState, useEffect } from 'react';
import { extractDominantColor, vibrateColor } from '../utils/colors';

interface AccentColorResult {
  /** RGB tuple */
  color: [number, number, number];
  /** CSS rgb() string for use in styles */
  cssColor: string;
  /** CSS rgba() with 0.5 alpha for box-shadow / glow effects */
  glowColor: string;
}

const FALLBACK: [number, number, number] = [180, 74, 255]; // neon purple

/**
 * Extracts the dominant accent color from an album art image URL.
 * Returns a fallback neon purple while loading or if extraction fails.
 */
export function useAccentColor(imageUrl: string | null | undefined): AccentColorResult {
  const [color, setColor] = useState<[number, number, number]>(FALLBACK);

  useEffect(() => {
    if (!imageUrl) {
      setColor(FALLBACK);
      return;
    }

    let cancelled = false;

    extractDominantColor(imageUrl).then((raw) => {
      if (cancelled) return;
      const vibrant = vibrateColor(raw[0], raw[1], raw[2], 1.4);
      setColor(vibrant);
    });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const [r, g, b] = color;

  return {
    color,
    cssColor: `rgb(${r}, ${g}, ${b})`,
    glowColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
  };
}
