'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { Address, Avatar, Name, Identity, EthBalance } from '@coinbase/onchainkit/identity';

export default function AudioAppHeader() {
  const router = useRouter();
  const active = router.pathname;

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <span className="brand-dot" />
          <span className="app-brand-text">Musual</span>
        </div>

        <nav className="app-nav">
          <Link
            href="/"
            className={`app-nav-link ${active === '/' ? 'is-active' : ''}`}
          >
            Generate
          </Link>
          <Link
            href="/marketplace"
            className={`app-nav-link ${active?.startsWith('/marketplace') ? 'is-active' : ''}`}
          >
            Marketplace
          </Link>
        </nav>

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
    </header>
  );
}
