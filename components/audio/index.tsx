'use client';

import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import UploadScreen from './UploadScreen';
import ResultScreen from './ResultScreen';

type Stage = 'upload' | 'result';

export default function AudioApp() {
  const [stage, setStage] = React.useState<Stage>('upload');
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);

  const handleGenerated = (urls: string[]) => {
    setImageUrls(urls);
    setStage('result');
  };

  const backToUpload = () => setStage('upload');

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image URL copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <>
      {stage === 'upload' ? (
        <UploadScreen onGenerated={handleGenerated} />
      ) : (
        <ResultScreen imageUrls={imageUrls} onBack={backToUpload} onCopy={copyToClipboard} />
      )}
      <Toaster position="bottom-center" reverseOrder={false} />
    </>
  );
}
