'use client';

import React from 'react';
import MintPannel from '../nft/MintPanel';

type Props = {
  imageUrls: string[];
  onBack: () => void;
  onCopy: (url: string) => void;
};

export default function ResultScreen({ imageUrls, onBack, onCopy }: Props) {
  const [active, setActive] = React.useState<number | null>(null);
  const galleryRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!galleryRef.current) return;
      const target = e.target as Node;
      if (!galleryRef.current.contains(target)) {
        setActive(null);
        return;
      }
      const isAction = (target as HTMLElement).closest('.action-btn');
      if (!isAction) return;
      e.stopPropagation();
    };
    document.addEventListener('click', onDocClick, { capture: true });
    return () => document.removeEventListener('click', onDocClick, { capture: true } as any);
  }, []);

  return (
    <main className="container vstack page-section">
      <section className="card vstack">
        <div className="row-between">
          <h1 className="title-light">Generated Images</h1>
          <button className="btn btn-ghost" onClick={() => { setActive(null); onBack(); }}>Back</button>
        </div>

        <div ref={galleryRef} className="gallery gallery-3">
          {imageUrls.map((u, i) => {
            const isActive = active === i;
            return (
              <figure
                key={i}
                className={`tile${isActive ? ' active' : ''}`}
                onClick={() => setActive(isActive ? null : i)}
              >
                <img src={u} alt={`Generated ${i + 1}`} className="tile-img" />
                <figcaption className="tile-overlay tile-overlay-center">
                  <div className="tile-actions">
                    <button
                      className="btn action-btn"
                      onClick={(e) => { e.stopPropagation(); onCopy(u); }}
                    >
                      Copy URL
                    </button>
                    <a
                      className="btn action-btn"
                      href={u}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open
                    </a>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      <MintPannel contractAddress="0xa935719F2c09a2DAd75137b85eFC20CCD95ac2B0" />
    </main>
  );
}
