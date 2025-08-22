export async function decodeToBuffer(file: File): Promise<AudioBuffer> {
  const buf = await file.arrayBuffer();
  const AC: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
  if (!AC) throw new Error("Web Audio API not supported");
  const ctx = new AC();
  const audioBuffer: AudioBuffer = await new Promise((res, rej) => ctx.decodeAudioData(buf, res, rej));
  ctx.close();
  return audioBuffer;
}

export async function resampleBuffer(src: AudioBuffer, targetSampleRate = 22050): Promise<AudioBuffer> {
  if (src.sampleRate === targetSampleRate) return src;
  const offline = new OfflineAudioContext(src.numberOfChannels, Math.ceil(src.duration * targetSampleRate), targetSampleRate);
  const srcNode = offline.createBufferSource();
  srcNode.buffer = src;
  srcNode.connect(offline.destination);
  srcNode.start(0);
  const rendered = await offline.startRendering();
  return rendered;
} 