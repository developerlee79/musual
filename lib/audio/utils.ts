export const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const hann = (N: number) => {
  const w = new Float32Array(N);
  for (let n = 0; n < N; n++) w[n] = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
  return w;
};
export const db = (x: number) => 20 * Math.log10(x + 1e-12);
export const normalize = (arr: Float32Array) => {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < arr.length; i++) { const v = arr[i]; if (v < min) min = v; if (v > max) max = v; }
  const out = new Float32Array(arr.length);
  const den = max - min || 1;
  for (let i = 0; i < arr.length; i++) out[i] = (arr[i] - min) / den;
  return out;
};
export const downmixMono = (channels: Float32Array[]) => {
  const N = channels[0].length;
  const out = new Float32Array(N);
  const C = channels.length;
  for (let i = 0; i < N; i++) {
    let s = 0;
    for (let c = 0; c < C; c++) s += channels[c][i] || 0;
    out[i] = s / C;
  }
  return out;
}; 