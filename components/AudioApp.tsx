'use client';

import React from 'react';
import { decodeToBuffer, resampleBuffer } from '../lib/audio/decode';
import { downmixMono } from '../lib/audio/utils';
import { analyzeSignal } from '../lib/audio/stft';
import type { FeatureSet } from '../types/features';
import { WaveformCanvas } from './visualize/WaveformCanvas';
import { SpectrogramCanvas } from './visualize/SpectrogramCanvas';
import { FeatureSummary } from './FeatureSummary';
import { useLogs, LogPane } from './ui/LogPane';
import { buildPromptFromFeatures } from '../lib/sogni/generator';

const DEFAULT_SAMPLE_RATE = 22050;

export default function AudioApp() {
  const { logs, log, clear } = useLogs();
  const [mono, setMono] = React.useState<Float32Array | null>(null);
  const [features, setFeatures] = React.useState<FeatureSet | null>(null);
  const [prompt, setPrompt] = React.useState<string>('abstract, vibrant, neon glow; live rock concert energy; crowd silhouettes; dynamic motion; negative: text, watermark');
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  const onFile = async (file: File) => {
    clear(); setBusy(true); setImageUrls([]); setFeatures(null); setMono(null);
    try {
      log(`Loading ${file.name}`);
      const decoded = await decodeToBuffer(file);
      log(`Decoded: ${decoded.sampleRate} Hz, ${decoded.numberOfChannels} ch, ${decoded.duration.toFixed(2)} s`);
      log(`Resampling to ${DEFAULT_SAMPLE_RATE} Hz`);
      const resampled = await resampleBuffer(decoded, DEFAULT_SAMPLE_RATE);
      const channels: Float32Array[] = [];
      for (let c = 0; c < resampled.numberOfChannels; c++) channels.push(resampled.getChannelData(c));
      const monoSig = downmixMono(channels);
      setMono(monoSig);
      log('Features → STFT & descriptors');
      const f = analyzeSignal(monoSig, resampled.sampleRate, { fftSize: 1024, hopSize: 256 });
      setFeatures(f);
      const energy = (f.rmsEnv.reduce((s, v) => s + v, 0) / f.rmsEnv.length) || 0;
      log(`Features → BPM≈${f.bpm ? f.bpm.toFixed(1) : '—'}, Energy≈${energy.toFixed(2)}`);
      log('Ready.');
    } catch (e: any) {
      console.error(e); log('ERROR: ' + (e?.message || e));
    } finally { setBusy(false); }
  };

  const onGenerate = async () => {
    if (!features || busy) return;
    setBusy(true); setImageUrls([]);
    try {
      const fullPrompt = buildPromptFromFeatures(features);

      console.log('[UI] POST /api/sogni →', { promptLen: fullPrompt.length, count: 3 });
      const t0 = performance.now();
      const resp = await fetch('/api/sogni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, count: 3 }),
      });

      if (!resp.ok) {
        let msg = `${resp.status} ${resp.statusText}`;
        try { const j = await resp.json(); if (j?.error) msg = `${resp.status} ${j.error}`; } catch {}
        throw new Error(`API /api/sogni 실패: ${msg}`);
      }

      const data = await resp.json() as { imageUrls?: string[]; meta?: any };
      console.log('[UI] /api/sogni ←', {
        ms: Math.round(performance.now() - t0),
        urls: data?.imageUrls?.length ?? 0,
        meta: data?.meta,
      });

      if (!data?.imageUrls?.length) throw new Error('이미지가 반환되지 않았습니다');
      setImageUrls(data.imageUrls);
    } catch (e: any) {
      console.error(e); log('SOGNI error: ' + (e?.message || e));
    } finally { setBusy(false); }
  };

  const exportSpectroPNG = () => {
    const canvas = document.querySelector('#spectro canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a'); a.href = url; a.download = 'spectrogram.png'; a.click();
  };

  return (
    <div className="container vstack">
      <div className="card vstack">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h1 style={{ margin:0, color:'#eef' }}>Audio → Image (SOGNI)</h1>
          <span className="badge">Next.js + TS</span>
        </div>
        <div className="hstack" style={{ flexWrap:'wrap', gap:8 }}>
          <div className="vstack">
            <label>Upload audio (30–60s)</label>
            <input type="file" accept="audio/*" disabled={busy} onChange={e=>{ const f=e.target.files?.[0]; if (f) onFile(f); }} />
          </div>
          <div className="vstack" style={{ minWidth: 300, flex:1 }}>
            <label>Prompt additions (narrative / style hints)</label>
            <input value={prompt} onChange={e=>setPrompt(e.target.value)} />
          </div>
          <div className="hstack" style={{ gap:8 }}>
            <button className="primary" onClick={onGenerate} disabled={!features || busy}>Generate with SOGNI</button>
            <button onClick={exportSpectroPNG} disabled={!features}>Export Spectrogram PNG</button>
          </div>
        </div>
      </div>

      <div className="grid">
        <div className="vstack">
          {mono && <WaveformCanvas mono={mono} width={1000} height={200} />}
          {features && (
            <div id="spectro">
              <SpectrogramCanvas
                spectrogram={features.spectrogram}
                frames={features.times.length}
                bins={features.freqs.length}
                width={1000}
                height={420}
              />
            </div>
          )}
        </div>
        <div className="vstack">
          <FeatureSummary f={features} />
          <LogPane logs={logs} />
        </div>
      </div>

      {!!imageUrls.length && (
        <div className="card vstack">
          <div style={{ color:'#9cf', fontWeight:700 }}>SOGNI Output</div>
          <div className="hstack" style={{ gap:12, flexWrap:'wrap' }}>
            {imageUrls.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt={`SOGNI Output ${i+1}`} style={{ maxWidth: 320, borderRadius:12 }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
