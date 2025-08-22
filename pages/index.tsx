import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';

const AudioApp = dynamic(() => import('../components/AudioApp'), { ssr: false });

export default function Home(){
  return (
    <>
      <Head>
        <title>Audio → Image Visualizer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AudioApp />
    </>
  );
} 