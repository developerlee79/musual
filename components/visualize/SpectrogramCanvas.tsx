'use client';
import React from 'react';
import { infernoLike } from '../../lib/colorMaps';

type Props = {
  spectrogram: Float32Array; // frames * bins, row-major
  frames: number;
  bins: number;
  dbRange?: [number, number]; // e.g., [-80, 0]
  width?: number; height?: number; title?: string;
};

export const SpectrogramCanvas: React.FC<Props> = ({ spectrogram, frames, bins, dbRange = [-80, 0], width = 1000, height = 400, title = 'Spectrogram' }) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const dpr = globalThis.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr, dpr);

    // compute global max for normalization
    let maxMag = 1e-9;
    for (let i = 0; i < spectrogram.length; i++) if (spectrogram[i] > maxMag) maxMag = spectrogram[i];

    const img = ctx.createImageData(width, height);
    const xScale = frames / width;
    const yScale = bins / height;
    const [dbMin, dbMax] = dbRange;

    for (let x = 0; x < width; x++) {
      const fIdx = Math.min(frames - 1, Math.floor(x * xScale));
      for (let y = 0; y < height; y++) {
        const bIdx = Math.min(bins - 1, bins - 1 - Math.floor(y * yScale)); // flip so low→bottom
        const mag = spectrogram[fIdx * bins + bIdx] / maxMag;
        // to dB-ish
        const dB = 20 * Math.log10(mag + 1e-9);
        let t = (dB - dbMin) / (dbMax - dbMin);
        if (!isFinite(t)) t = 0; t = Math.max(0, Math.min(1, t));
        const [R, G, B] = infernoLike(t);
        const idx = (y * width + x) * 4;
        img.data[idx] = R; img.data[idx + 1] = G; img.data[idx + 2] = B; img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [spectrogram, frames, bins, dbRange, width, height]);

  return (
    <div>
      <div style={{ color:'#9cf', fontWeight:700, marginBottom:6 }}>{title}</div>
      <div className="canvasWrap"><canvas ref={ref} /></div>
      <div className="caption">Time (left→right), Frequency (low→bottom)</div>
    </div>
  );
}; 