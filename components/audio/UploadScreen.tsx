'use client';

import React from 'react';
import { decodeToBuffer, resampleBuffer } from '../../lib/audio/decode';
import { downmixMono } from '../../lib/audio/utils';
import { analyzeSignal } from '../../lib/audio/stft';
import type { FeatureSet } from '../../types/features';
import { useLogs } from '../ui/LogPane';
import toast from 'react-hot-toast';
import { buildPromptFromFeatures } from '../../lib/sogni/generator';

const DEFAULT_SAMPLE_RATE = 22050;

type Props = { onGenerated: (urls: string[]) => void };

export default function UploadScreen({ onGenerated }: Props) {
  const { log, clear } = useLogs();
  const [features, setFeatures] = React.useState<FeatureSet | null>(null);
  const [busy, setBusy] = React.useState(false);

  const onFile = async (file: File) => {
    clear();
    setBusy(true);
    setFeatures(null);
    try {
      log(`Loading ${file.name}`);
      const decoded = await decodeToBuffer(file);
      log(`Decoded: ${decoded.sampleRate} Hz, ${decoded.numberOfChannels} ch, ${decoded.duration.toFixed(2)} s`);
      log(`Resampling to ${DEFAULT_SAMPLE_RATE} Hz`);
      const resampled = await resampleBuffer(decoded, DEFAULT_SAMPLE_RATE);
      const channels: Float32Array[] = [];
      for (let c = 0; c < resampled.numberOfChannels; c++) channels.push(resampled.getChannelData(c));
      const monoSig = downmixMono(channels);
      log('Features → STFT & descriptors');
      const f = analyzeSignal(monoSig, resampled.sampleRate, { fftSize: 1024, hopSize: 256 });
      setFeatures(f);
      const energy = (f.rmsEnv.reduce((s, v) => s + v, 0) / f.rmsEnv.length) || 0;
      log(`Features → BPM≈${f.bpm ? f.bpm.toFixed(1) : '—'}, Energy≈${energy.toFixed(2)}`);
      log('Ready.');
      toast.success('Audio ready. Now hit Generate!');
    } catch (e: any) {
      console.error(e);
      log('ERROR: ' + (e?.message || e));
      toast.error('Failed to process audio');
    } finally {
      setBusy(false);
    }
  };

  const onGenerate = async () => {
    if (!features || busy) return;
    setBusy(true);
    try {
      const fullPrompt = buildPromptFromFeatures(features);
      const t0 = performance.now();
      const resp = await fetch('/api/sogni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt, count: 3 }),
      });
      if (!resp.ok) {
        let msg = `${resp.status} ${resp.statusText}`;
        try {
          const j = await resp.json();
          if (j?.error) msg = `${resp.status} ${j.error}`;
        } catch {}
        throw new Error(`API /api/sogni 실패: ${msg}`);
      }
      const data = (await resp.json()) as { imageUrls?: string[]; meta?: any };
      console.log('[UI] /api/sogni ←', {
        ms: Math.round(performance.now() - t0),
        urls: data?.imageUrls?.length ?? 0,
        meta: data?.meta,
      });
      if (!data?.imageUrls?.length) throw new Error('이미지가 반환되지 않았습니다');
      onGenerated(data.imageUrls);
    } catch (e: any) {
      console.error(e);
      log('SOGNI error: ' + (e?.message || e));
      toast.error('Image generation failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container hero">
      <section className="card hero-card vstack">
        <div className="brand-lockup">
          <div className="brand-mark">M</div>
          <h1 className="brand-title">Musual</h1>
        </div>
        <p className="muted">Turn your performance into visual art.</p>
        <div className="upload-stack vstack">
          <label className="sr-only" htmlFor="audio">Upload music audio file (30–60s)</label>
          <input
            id="audio"
            type="file"
            accept="audio/*"
            disabled={busy}
            className="file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <button className="btn btn-primary" onClick={onGenerate} disabled={!features || busy}>
            Generate
          </button>
        </div>
      </section>
    </main>
  );
}
