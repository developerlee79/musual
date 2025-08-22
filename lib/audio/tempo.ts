import { normalize } from './utils';

export function computeTempo(onsetEnv: Float32Array, hopSize: number, sampleRate: number, minBPM = 60, maxBPM = 220){
  if (onsetEnv.length < 8) return { bpm: null, confidence: null };
  // normalize & smooth (simple moving average)
  const x = normalize(onsetEnv);
  const win = Math.max(3, Math.floor(0.05 * sampleRate / hopSize));
  const y = new Float32Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) { acc += x[i]; if (i >= win) acc -= x[i - win]; y[i] = acc / Math.min(i + 1, win); }

  // autocorrelation at candidate lags corresponding to BPM range
  const minLag = Math.floor((60 * sampleRate) / (maxBPM * hopSize));
  const maxLag = Math.floor((60 * sampleRate) / (minBPM * hopSize));
  let bestLag = 0, best = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag++) {
    let s = 0;
    for (let i = lag; i < y.length; i++) s += y[i] * y[i - lag];
    if (s > best) { best = s; bestLag = lag; }
  }
  if (bestLag === 0) return { bpm: null, confidence: null };
  const bpm = 60 * sampleRate / (bestLag * hopSize);
  // crude confidence: peak / zero-lag energy
  let energy = 0; for (let i = 0; i < y.length; i++) energy += y[i] * y[i];
  const confidence = Math.max(0, Math.min(1, best / (energy + 1e-9)));
  return { bpm, confidence };
} 