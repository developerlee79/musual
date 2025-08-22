export type FeatureSet = {
  sampleRate: number;
  duration: number;
  channels: number;
  hopSize: number;
  fftSize: number;
  times: Float32Array; 
  freqs: Float32Array; 
  spectrogram: Float32Array;
  rmsEnv: Float32Array;
  centroidHz: Float32Array; 
  rolloffHz: Float32Array;
  flux: Float32Array;
  bpm: number | null;
  bpmConfidence: number | null;
  bandsEnergy: { low: number; mid: number; high: number };
}; 