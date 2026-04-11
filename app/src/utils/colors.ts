/** Extract dominant color from an image URL using canvas */
export async function extractDominantColor(imageUrl: string): Promise<[number, number, number]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 10;
      canvas.height = 10;
      ctx.drawImage(img, 0, 0, 10, 10);
      const data = ctx.getImageData(0, 0, 10, 10).data;

      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Skip very dark and very light pixels
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (brightness > 30 && brightness < 230) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count === 0) {
        resolve([100, 50, 200]); // Fallback purple
      } else {
        resolve([Math.round(r / count), Math.round(g / count), Math.round(b / count)]);
      }
    };
    img.onerror = () => resolve([100, 50, 200]);
    img.src = imageUrl;
  });
}

/** Make a color more vibrant by increasing saturation */
export function vibrateColor(r: number, g: number, b: number, factor = 1.5): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const mid = (max + min) / 2;

  return [
    Math.min(255, Math.round(mid + (r - mid) * factor)),
    Math.min(255, Math.round(mid + (g - mid) * factor)),
    Math.min(255, Math.round(mid + (b - mid) * factor)),
  ];
}
