import FFT from 'fft.js';
import { hann } from './utils';
import type { FeatureSet } from '../../types/features';
import { computeTempo } from './tempo';

export type STFTOptions = { fftSize?: number; hopSize?: number; sampleRate?: number };

export function analyzeSignal(signalMono: Float32Array, sampleRate: number, opts: STFTOptions = {}): FeatureSet {
  const fftSize = opts.fftSize ?? 1024; // power of two
  const hop = opts.hopSize ?? (fftSize >> 2); // 256 by default
  const win = hann(fftSize);
  const fft = new (FFT as any)(fftSize);
  const bins = fftSize / 2 + 1;

  const frames = Math.floor((signalMono.length - fftSize) / hop) + 1;
  const spectrogram = new Float32Array(frames * bins);
  const rmsEnv = new Float32Array(frames);
  const centroidHz = new Float32Array(frames);
  const rolloffHz = new Float32Array(frames);
  const flux = new Float32Array(frames);
  const freqs = new Float32Array(bins);
  const times = new Float32Array(frames);

  for (let k = 0; k < bins; k++) freqs[k] = (k * sampleRate) / fftSize;

  const frameBuf = new Float32Array(fftSize);
  const out = (fft as any).createComplexArray();
  const prevMag = new Float32Array(bins);

  for (let i = 0; i < frames; i++) {
    const start = i * hop;
    let sumsq = 0;
    for (let n = 0; n < fftSize; n++) {
      const v = (signalMono[start + n] || 0) * win[n];
      frameBuf[n] = v;
      sumsq += v * v;
    }
    times[i] = (start + fftSize * 0.5) / sampleRate;
    rmsEnv[i] = Math.sqrt(sumsq / fftSize);

    (fft as any).realTransform(out, frameBuf);
    (fft as any).completeSpectrum(out);

    let magSum = 0, wSum = 0;
    // fill magnitudes & features
    for (let k = 0; k < bins; k++) {
      const re = out[2 * k];
      const im = out[2 * k + 1];
      const mag = Math.sqrt(re * re + im * im);
      spectrogram[i * bins + k] = mag;
      magSum += mag;
      wSum += mag * freqs[k];
    }
    centroidHz[i] = magSum > 1e-12 ? wSum / magSum : 0;

    // spectral rolloff @ 85% energy
    const target = 0.85 * magSum;
    let acc = 0, kroll = 0;
    for (let k = 0; k < bins; k++) { acc += spectrogram[i * bins + k]; if (acc >= target) { kroll = k; break; } }
    rolloffHz[i] = freqs[kroll] || 0;

    // spectral flux
    let fluxVal = 0;
    for (let k = 0; k < bins; k++) {
      const m = spectrogram[i * bins + k];
      const d = m - prevMag[k];
      if (d > 0) fluxVal += d;
      prevMag[k] = m;
    }
    flux[i] = fluxVal;
  }

  // tempo from onset envelope (flux)
  const { bpm, confidence } = computeTempo(flux, hop, sampleRate);

  // band energy proportions for low/mid/high
  const bands = { low: 0, mid: 0, high: 0 } as { low: number; mid: number; high: number };
  const lowMax = 250, midMax = 2000; // Hz
  for (let i = 0; i < frames; i++) {
    for (let k = 0; k < bins; k++) {
      const f = freqs[k];
      const m = spectrogram[i * bins + k];
      if (f < lowMax) bands.low += m; else if (f < midMax) bands.mid += m; else bands.high += m;
    }
  }
  const total = bands.low + bands.mid + bands.high || 1;
  const bandsEnergy = { low: bands.low / total, mid: bands.mid / total, high: bands.high / total };

  return { sampleRate, duration: signalMono.length / sampleRate, channels: 1, hopSize: hop, fftSize, times, freqs, spectrogram, rmsEnv, centroidHz, rolloffHz, flux, bpm, bpmConfidence: confidence, bandsEnergy };
} 