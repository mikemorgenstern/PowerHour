import { useRef, useEffect, useCallback } from 'react';

interface VisualizerProps {
  analyserNode: AnalyserNode | null;
  accentColor: string; // CSS color string, e.g. "rgb(255, 45, 138)"
  /** Diameter of the inner circle (album art area) in px */
  innerRadius?: number;
}

/**
 * Canvas-based circular frequency visualizer.
 * Bars radiate outward from a circle behind/around the album art.
 * Falls back to a subtle ambient pulsing animation when no analyser is available.
 */
export default function Visualizer({
  analyserNode,
  accentColor,
  innerRadius = 160,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Size canvas to its display size (handle DPR for sharpness)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const baseRadius = innerRadius * 0.55; // Slightly inside the art edge
    const barCount = 64;
    const sliceAngle = (Math.PI * 2) / barCount;

    let dataArray: Uint8Array<ArrayBuffer> | null = null;

    if (analyserNode) {
      const buf = new ArrayBuffer(analyserNode.frequencyBinCount);
      dataArray = new Uint8Array(buf);
      analyserNode.getByteFrequencyData(dataArray);
    }

    for (let i = 0; i < barCount; i++) {
      const angle = i * sliceAngle - Math.PI / 2;

      let barHeight: number;
      if (dataArray) {
        // Map bar index to frequency bin (skip the lowest bins, they're often noisy)
        const binIndex = Math.floor((i / barCount) * (dataArray.length * 0.8)) + 4;
        const value = dataArray[Math.min(binIndex, dataArray.length - 1)] / 255;
        barHeight = value * 80 + 4;
      } else {
        // Ambient fallback: gentle sine-wave pulsation
        phaseRef.current += 0.0003;
        const wave = Math.sin(phaseRef.current * 60 + i * 0.4) * 0.5 + 0.5;
        barHeight = wave * 30 + 6;
      }

      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.globalAlpha = dataArray ? 0.7 : 0.25;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(draw);
  }, [analyserNode, accentColor, innerRadius]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
