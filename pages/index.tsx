import React from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import '@coinbase/onchainkit/styles.css';
import { Providers } from 'lib/chain/provider';
import AudioAppHeader from 'components/ui/AppHeader';

const AudioApp = dynamic(() => import('components/audio'), { ssr: false });

export default function Home() {
  return (
    <Providers>
      <Head>
        <title>Musual</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AudioAppHeader />
      <AudioApp />
    </Providers>
  );
}
