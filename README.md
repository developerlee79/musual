# Musual

Turn your music into AI-generated visual art and mint it as an NFT.

This project extracts audio features from your music files, visualizes them, generates unique artwork using AI, and enables seamless NFT minting on-chain.

By empowering music artists with new creative tools, providing them with new revenue opportunities, and simplifying Web3 onboarding, it aims to support artistic expression and broaden access to decentralized culture.  

<br>

## Tech Stack

- **Next.js + React + TypeScript** — Frontend framework and UI  
- **Sogni AI** — AI image generation from extracted audio features  
- **Base OnchainKit** — NFT minting and on-chain integration  

<br>

## How to run

To run the project, you must create a `.env` file in the root directory following the format below.

```env
NEXT_PUBLIC_SOGNI_APP_ID=ANY_RANDOM_ID
NEXT_PUBLIC_SOGNI_USERNAME=YOUR_SOGNI_USERNAME
NEXT_PUBLIC_SOGNI_PASSWORD=YOUR_SOGNI_PASSWORD
NEXT_PUBLIC_SOGNI_NETWORK=fast
NEXT_PUBLIC_ONCHAINKIT_API_KEY=YOUR_API_KEY
```

Then, build the project and start the application.

```bash
npm run build
npm run dev -- -p 3000
```
