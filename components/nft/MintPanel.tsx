'use client';

import React, { useMemo, useState } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { Transaction } from '@coinbase/onchainkit/transaction';
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

function toBase64Utf8(str: string) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function toTokenURI(imageUrl: string, name: string, description: string) {
  const isVideo = /\.(mp4|webm|ogg)$/i.test(imageUrl);
  const meta: Record<string, unknown> = {
    name: name || 'Untitled',
    description: description || '',
    ...(isVideo ? { animation_url: imageUrl } : { image: imageUrl }),
  };

  const json = JSON.stringify(meta);
  const b64 = toBase64Utf8(json);
  return `data:application/json;base64,${b64}`;
}

export default function MintPannel({ contractAddress }: { contractAddress: `0x${string}` }) {
  const { address, status } = useAccount();
  const chainId = useChainId();

  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const tokenURI = useMemo(() => {
    if (!url) return '';
    try {
      return toTokenURI(url.trim(), name.trim(), desc.trim());
    } catch {
      return '';
    }
  }, [url, name, desc]);

  const ready =
    status === 'connected' &&
    !!address &&
    chainId === baseSepolia.id &&
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
    <section className="card vstack">
      <h2 className="section-title">Mint your artwork</h2>

      <div className="max-w-[560px] w-full rounded-2xl space-y-4">

        <label className="block text-sm font-medium">Image / Video URL</label>
        <input
          className="w-full rounded-lg border px-3 py-2 mt-1"
          placeholder="https://... (png/jpg/svg/mp4/webm/ogg) or data:image/*;base64,..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="w-full rounded-lg border px-3 py-2 mt-1"
              placeholder="My Artwork #1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <input
              className="w-full rounded-lg border px-3 py-2 mt-1 mb-4"
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
            <div className="text-xs text-gray-500 mt-2 break-all">
              <div className="font-medium">tokenURI (data: JSON)</div>
              {tokenURI.slice(0, 120)}{tokenURI.length > 120 ? '…' : ''}
            </div>
          </div>
        )}
        
        <Transaction chainId={baseSepolia.id} calls={calls} disabled={!ready} />
      </div>
    </section>
  );
}
