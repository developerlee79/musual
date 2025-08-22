'use client';

import React, { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Transaction } from '@coinbase/onchainkit/transaction';
import { Wallet, ConnectWallet, WalletDropdown, WalletDropdownDisconnect } from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';
import type { Abi } from 'viem';

const ABI: Abi = [
  {
    type: 'function',
    name: 'mintWithURI',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [],
  },
];

function toTokenURI(imageUrl: string, name: string, description: string) {
  return `${imageUrl}@${name}@${description}`;
}

export default function MintPannel({ contractAddress }: { contractAddress: `0x${string}` }) {
  const { address, status } = useAccount();
  
  const chainId = useChainId();

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const tokenURI = useMemo(() => (url ? toTokenURI(url, name, desc) : ''), [url, name, desc]);

  const ready =
    status === 'connected' &&
    !!address &&
    chainId === baseSepolia.id &&
    !!url &&
    !!tokenURI;

  const calls = useMemo(() => {
    if (!ready) return [];

    return [
      {
        address: contractAddress,
        abi: ABI,
        functionName: 'mintWithURI' as const,
        args: [address!, tokenURI],
        chainId: baseSepolia.id,
      },
    ];
  }, [ready, contractAddress, address, tokenURI]);

  return (
    <div className="max-w-[560px] w-full rounded-2xl border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mint NFT from Generated Image</h2>
        <Wallet>
          <ConnectWallet>
            <Avatar className="h-6 w-6" />
            <Name />
          </ConnectWallet>
          <WalletDropdown>
            <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
              <Avatar />
              <Name />
              <Address />
              <EthBalance />
            </Identity>
            <WalletDropdownDisconnect />
          </WalletDropdown>
        </Wallet>
      </div>

      <label className="block text-sm font-medium">Image URL</label>
      <input
        className="w-full rounded-lg border px-3 py-2"
        placeholder="https://... (png/jpg/mp4)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="My Artwork #1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Description</label>
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Optional"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
        </div>
      </div>

      {url && (
        <div className="rounded-xl border p-3">
          <div className="text-sm mb-2">Preview</div>
          {/\.(mp4|webm|ogg)$/i.test(url) ? (
            <video src={url} controls className="w-full rounded-lg" />
          ) : (
            <img src={url} alt="preview" className="w-full rounded-lg" />
          )}
        </div>
      )}

      <Transaction chainId={baseSepolia.id} calls={calls} disabled={!ready} />
    </div>
  );
}
