import type { NextApiRequest, NextApiResponse } from 'next';
import { generateWithSogniFromPrompt } from '../../lib/sogni/generator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startedAt = Date.now();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, count } = req.body as { prompt?: string; count?: number };
    if (!prompt || typeof prompt !== 'string') {
      console.warn('[API /api/sogni] 400 invalid prompt');
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const capped = Math.max(1, Math.min(3, Number(count) || 1));
    console.log('[API /api/sogni] IN ←', { promptLen: prompt.length, count: capped });

    const { imageUrls, meta } = await generateWithSogniFromPrompt(prompt, capped);

    console.log('[API /api/sogni] OUT →', {
      urls: imageUrls.length,
      elapsedMs: Date.now() - startedAt,
      meta,
    });
    return res.status(200).json({ imageUrls, meta });
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status ?? 500;
    const payload = err?.payload ?? err?.response?.data ?? err?.message ?? err;
    console.error('[API /api/sogni] ERROR →', {
      status, payload, elapsedMs: Date.now() - startedAt,
      stack: err?.stack,
    });
    return res.status(500).json({ error: typeof payload === 'string' ? payload : 'SOGNI error' });
  }
}
