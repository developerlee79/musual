import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import MintPannel from 'components/MintPanel';
import '@coinbase/onchainkit/styles.css'; 
import { Providers } from 'lib/chain/provider';

const AudioApp = dynamic(() => import('../components/AudioApp'), { ssr: false });

export default function Home() {
  return (
    <Providers>
      <Head>
        <title>Musual</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AudioApp />
      <MintPannel contractAddress="0xa935719F2c09a2DAd75137b85eFC20CCD95ac2B0" />
    </Providers>
  );
}
