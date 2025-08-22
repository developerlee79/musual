'use client';
import React from 'react';
import { infernoLike } from '../../lib/colorMaps';

type Props = {
  spectrogram: Float32Array;   // frames * bins, row-major
  frames: number;
  bins: number;
  dbRange?: [number, number];  // e.g., [-80, 0]
  height?: number;             // CSS px 높이 (기본 400)
  title?: string;
};

export const SpectrogramCanvas: React.FC<Props> = ({
  spectrogram,
  frames,
  bins,
  dbRange = [-80, 0],
  height = 400,
  title = 'Spectrogram',
}) => {
  const ref = React.useRef<HTMLCanvasElement | null>(null);
  const [cssW, setCssW] = React.useState(0);

  // 부모 폭 변화 감지 → cssW 업데이트
  React.useEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement; // .canvasWrap
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      setCssW(parent.clientWidth);
    });
    ro.observe(parent);
    // 초기값
    setCssW(parent.clientWidth);
    return () => ro.disconnect();
  }, []);

  // 렌더링
  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas || cssW <= 0) return;

    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const cssH = height;

    // 내부 버퍼 해상도 (물리 픽셀)
    canvas.width  = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    // 화면 크기 (CSS 픽셀)
    canvas.style.width = '100%';
    canvas.style.height = `${cssH}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 좌표계를 CSS 픽셀 기준으로 설정 (scale 누적 방지 위해 setTransform)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    // 전역 최대값 (정규화)
    let maxMag = 1e-9;
    for (let i = 0; i < spectrogram.length; i++) {
      const v = spectrogram[i];
      if (v > maxMag) maxMag = v;
    }

    const img = ctx.createImageData(cssW, cssH);
    const xScale = frames / cssW;
    const yScale = bins / cssH;
    const [dbMin, dbMax] = dbRange;

    for (let x = 0; x < cssW; x++) {
      const fIdx = Math.min(frames - 1, Math.floor(x * xScale));
      const base = fIdx * bins;
      for (let y = 0; y < cssH; y++) {
        const bIdx = Math.min(bins - 1, bins - 1 - Math.floor(y * yScale)); // 저역이 아래로
        const mag = spectrogram[base + bIdx] / maxMag;
        const dB = 20 * Math.log10(mag + 1e-9);
        let t = (dB - dbMin) / (dbMax - dbMin);
        if (!isFinite(t)) t = 0;
        t = Math.max(0, Math.min(1, t));
        const [R, G, B] = infernoLike(t);

        const idx = (y * cssW + x) * 4;
        img.data[idx] = R;
        img.data[idx + 1] = G;
        img.data[idx + 2] = B;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [spectrogram, frames, bins, dbRange, height, cssW]);

  return (
    <div>
      <div style={{ color:'#9cf', fontWeight:700, marginBottom:6 }}>{title}</div>
      <div className="canvasWrap">
        <canvas ref={ref} />
      </div>
      <div className="caption">Time (left→right), Frequency (low→bottom)</div>
    </div>
  );
};
