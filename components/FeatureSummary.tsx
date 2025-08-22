'use client';
import React from 'react';
import type { FeatureSet } from '../types/features';

export const FeatureSummary: React.FC<{ f: FeatureSet | null }> = ({ f }) => {
  if (!f) return null;
  const fmtPct = (x:number) => `${Math.round(x*100)}%`;
  const energy = f.rmsEnv.length ? (f.rmsEnv.reduce((s,v)=>s+v,0)/f.rmsEnv.length) : 0;
  return (
    <div className="card vstack">
      <div style={{ fontWeight: 700, color:'#9cf' }}>Summary</div>
      <div className="kv">
        <div>Duration</div><div>{f.duration.toFixed(2)} s</div>
        <div>BPM (est)</div><div>{f.bpm ? f.bpm.toFixed(1) : '—'}{f.bpmConfidence!=null? ` (conf ${Math.round((f.bpmConfidence||0)*100)}%)`:''}</div>
        <div>Energy (avg RMS)</div><div>{energy.toFixed(3)}</div>
        <div>Freq Balance</div><div>Low {fmtPct(f.bandsEnergy.low)} · Mid {fmtPct(f.bandsEnergy.mid)} · High {fmtPct(f.bandsEnergy.high)}</div>
        <div>FFT / Hop</div><div>{f.fftSize} / {f.hopSize} samples</div>
        <div>Sample Rate</div><div>{f.sampleRate} Hz</div>
      </div>
    </div>
  );
}; 