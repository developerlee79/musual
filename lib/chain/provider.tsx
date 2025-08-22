import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { baseSepolia } from 'wagmi/chains'; 
import { type ReactNode, useState } from 'react';
import { type State, WagmiProvider } from 'wagmi';
import { http, cookieStorage, createConfig, createStorage } from 'wagmi';
import { coinbaseWallet, metaMask } from 'wagmi/connectors';

function getConfig() {
  return createConfig({
    chains: [baseSepolia],
    connectors: [
      metaMask({
        
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [baseSepolia.id]: http(),
    },
  });
}

declare module 'wagmi' {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const [config] = useState(() => getConfig());
  const [queryClient] = useState(() => new QueryClient());
  const apiKey = process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY

  return (
    <WagmiProvider config={config} initialState={props.initialState}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={apiKey}
          chain={baseSepolia}
        >
          {props.children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
