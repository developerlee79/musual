'use client';
import React from 'react';

type Props = { mono: Float32Array; width?: number; height?: number; title?: string };

export const WaveformCanvas: React.FC<Props> = ({ mono, width = 1000, height = 200, title = 'Waveform' }) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const dpr = globalThis.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr); canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#4af'; ctx.lineWidth = 1;

    // decimate to pixels
    const step = Math.ceil(mono.length / width);
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const start = x * step, end = Math.min(mono.length, start + step);
      let min = 1e9, max = -1e9;
      for (let i = start; i < end; i++) { const v = mono[i]; if (v < min) min = v; if (v > max) max = v; }
      const y1 = ((1 - (max + 1) / 2) * height);
      const y2 = ((1 - (min + 1) / 2) * height);
      ctx.moveTo(x + 0.5, y1); ctx.lineTo(x + 0.5, y2);
    }
    ctx.stroke();

    // midline
    ctx.strokeStyle = '#222';
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
  }, [mono, width, height]);

  return (
    <div>
      <div style={{ color:'#9cf', fontWeight:700, marginBottom:6 }}>{title}</div>
      <div className="canvasWrap"><canvas ref={ref} /></div>
      <div className="caption">Mono waveform (peak-min per-pixel)</div>
    </div>
  );
}; 