'use client';

import React from 'react';
import MintPannel from '../nft/MintPanel';

type Props = {
  imageUrls: string[];
  onBack: () => void;
  onCopy: (url: string) => void;
};

export default function ResultScreen({ imageUrls, onBack, onCopy }: Props) {
  return (
    <main className="container vstack page-section">
      <section className="card vstack">
        <div className="row-between">
          <h1 className="title-light">Generated Images</h1>
          <button className="btn btn-ghost" onClick={onBack}>Back</button>
        </div>
        <div className="gallery">
          {imageUrls.map((u, i) => (
            <img
              key={i}
              src={u}
              alt={`SOGNI Output ${i + 1}`}
              className="thumb-320"
              onClick={() => onCopy(u)}
            />
          ))}
        </div>
      </section>
      <MintPannel contractAddress="0xa935719F2c09a2DAd75137b85eFC20CCD95ac2B0" />
    </main>
  );
}
