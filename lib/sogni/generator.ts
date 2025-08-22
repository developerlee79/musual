import type { FeatureSet } from '../../types/features';
import { SogniClient } from '@sogni-ai/sogni-client';

export type SogniPrompt = { style?: string; narrative?: string; negative?: string };

export function buildPromptFromFeatures(f: FeatureSet): string {
  const tempo = f.bpm ? `${Math.round(f.bpm)} BPM` : 'unknown tempo';
  const tone = f.centroidHz ? Math.round(avg(f.centroidHz)) : 0;
  const balance = `low ${pct(f.bandsEnergy.low)}, mid ${pct(f.bandsEnergy.mid)}, high ${pct(f.bandsEnergy.high)}`;
  const base = `An abstract artistic visualization of a live music audio. Dynamic motion, sound waves, spectrograms, waveforms, colorful lights. Abstracts these: Tempo ${tempo}, timbre centroid ~${tone} Hz, frequency balance ${balance}.`.trim();
  return `${base}`;
}

const avg = (a: Float32Array) => (a.length ? [...a].reduce((s, v) => s + v, 0) / a.length : 0);
const pct = (x: number) => `${Math.round(x * 100)}%`;
const safeJson = (v: any) => { try { return JSON.stringify(v); } catch { return String(v); } };

function dumpError(prefix: string, e: any) {
  const status = e?.status ?? e?.response?.status ?? e?.code;
  const payload = e?.payload ?? e?.response?.data ?? e?.message ?? e;
  console.error(`[SOGNI] ${prefix} ERROR`, { status, payload, stack: e?.stack });
}

declare global { var __sogniClientPromise: Promise<SogniClient> | null | undefined; } // eslint-disable-line no-var

let clientPromise: Promise<SogniClient> | null =
  typeof globalThis !== 'undefined' ? (globalThis.__sogniClientPromise ?? null) : null;

async function getClient(): Promise<SogniClient> {
  if (!clientPromise) {
    const appId = process.env.SOGNI_APP_ID?.trim();
    const username = process.env.SOGNI_USERNAME?.trim();
    const password = process.env.SOGNI_PASSWORD?.trim();
    const netEnv = process.env.SOGNI_NETWORK as 'fast' | 'relaxed' | undefined;
    const network = netEnv === 'relaxed' ? 'relaxed' : 'fast';

    if (!appId || !username || !password) {
      throw new Error('Missing SOGNI env: SOGNI_APP_ID / SOGNI_USERNAME / SOGNI_PASSWORD');
    }

    const p = (async () => {
      console.log('[SOGNI] createInstance', { network, appId: appId.slice(0, 8) });
      const t0 = Date.now();
      const c = await SogniClient.createInstance({ appId, network });

      console.log('[SOGNI] login…');
      await c.account.login(username, password);
      console.log('[SOGNI] login OK in', Date.now() - t0, 'ms');

      console.log('[SOGNI] waitForModels…');
      const models = await c.projects.waitForModels();
      console.log('[SOGNI] models len=', models?.length ?? 0);

      return c;
    })();

    clientPromise = p;
    if (typeof globalThis !== 'undefined') globalThis.__sogniClientPromise = p;
  }
  return clientPromise!;
}

function pickOnlineModel(models: any[]) {
  if (!models?.length) return null;
  const online = models.filter((m: any) => (m?.workerCount ?? 0) > 0);
  const chosen = (online.length ? online : models).reduce((a: any, b: any) =>
    a.workerCount > b.workerCount ? a : b
  );
  console.log('[SOGNI] pick model', { id: chosen?.id, workers: chosen?.workerCount });
  return chosen;
}

let lock: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  let release!: () => void;
  const prev = lock;
  lock = new Promise<void>(r => (release = r));
  return (async () => {
    await prev;
    try { return await fn(); }
    finally { release(); }
  })();
}

async function createAndWait(client: SogniClient, params: any) {
  const createdAt = Date.now();
  console.log('[SOGNI] create project params →', {
    modelId: params.modelId, steps: params.steps, guidance: params.guidance,
    numberOfImages: params.numberOfImages, sizePreset: params.sizePreset,
  });

  const project: any = await client.projects.create(params);
  console.log('[SOGNI] project.id =', project?.id);

  try {
    project.on?.('progress', (p: any) => {
      console.log('[SOGNI] progress', typeof p === 'object' ? safeJson(p) : p);
    });

    client.projects.on('project', (event) => {
      console.log(`Project event: "${event.type}" payload:`, event);
      if (['completed', 'failed', 'error'].includes(event.type)) {
        console.log('Project completed or failed, exiting...');
      }
    });

    client.projects.on('job', (event) => {
      console.log(`Job event: "${event.type}" payload:`, event);
    });

    project.on?.('jobCompleted', (job: any) => {
      console.log('[SOGNI] jobCompleted', { id: job?.id, resultUrl: job?.resultUrl });
    });
    
    project.on?.('jobFailed', (job: any) => {
      console.log('[SOGNI] jobFailed', { id: job?.id, error: job?.error });
    });
    
    project.on?.('completed', async (images: any) => {
      console.log('[SOGNI] completed(evt)', {
        type: Array.isArray(images) ? 'array' : typeof images,
        len: Array.isArray(images) ? images.length : undefined,
        keys: images && typeof images === 'object' ? Object.keys(images) : undefined,
      });
    });

    project.on?.('failed', async (err: any) => {
      console.log('[SOGNI] failed(evt)', err);
    });
  } catch (e) {
    console.warn('[SOGNI] event binding failed', e);
  }

  let urls: string[] = [];
  const t0 = Date.now();
  try {
    if (typeof project?.waitForCompletion === 'function') {
      urls = await project.waitForCompletion();
      console.log('[SOGNI] waitForCompletion OK', {
        elapsedMs: Date.now() - t0,
        urlCount: urls?.length ?? 0,
      });
      console.log('urls: ' + urls);
    } else {
      console.warn('[SOGNI] waitForCompletion not found, falling back to events');
      urls = await new Promise<string[]>((resolve, reject) => {
        let settled = false;
        const done = (err?: any, out?: string[]) => {
          if (settled) return; settled = true;
          err ? reject(err) : resolve(out || []);
        };
        project.once?.('completed', (images: any) => {
          const a = Array.isArray(images) ? images : [];
          console.log('[SOGNI] completed(fallback)', { len: a.length });
          done(undefined, a);
        });
        project.once?.('failed', (err: any) => {
          console.log('[SOGNI] failed(fallback)', err);
          done(err);
        });
        setTimeout(() => done(new Error('Timeout waiting for completion (fallback)')), 240_000);
      });
    }
  } catch (e: any) {
    dumpError('waitForCompletion', e);
    throw e;
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('Completed without image URLs');
  }

  console.log('[SOGNI] project done', {
    urlCount: urls.length, elapsedMs: Date.now() - createdAt,
  });
  return urls;
}

export async function generateWithSogniFromPrompt(prompt: string, count = 1): Promise<{ imageUrls: string[], meta: any }> {
  return withLock(async () => {
    const client = await getClient();
    const models = client.projects.availableModels;
    console.log('[SOGNI] availableModels =', models?.length ?? 0);
    if (!models?.length) throw new Error('No SOGNI models available');

    const model = pickOnlineModel(models);
    if (!model) throw new Error('No suitable SOGNI model');

    const params = {
      modelId: model.id,
      steps: 20,         
      guidance: 7.5,  
      disableNSFWFilter: true,
      tokenType: 'spark',
      positivePrompt: prompt,
      negativePrompt: 'text, watermark, logo, letters, photorealistic faces, hands, literal instruments, low resolution, blurry, oversharpen, distorted anatomy, cropped, jpeg artifacts, realistic draw',
      stylePrompt: 'Abstract painting, vibrant neon glow, psychedelic lighting, dynamic digital art, surreal atmosphere, high contrast, expressive brushstrokes, cinematic composition, inspired by contemporary abstract expressionism, spectrogramic background style',
      numberOfImages: Math.max(1, Math.min(3, count)),
    };

    const imageUrls = await createAndWait(client, params);
    return { imageUrls, meta: { modelId: model.id, network: (client as any)?.options?.network, steps: params.steps, guidance: params.guidance } };
  });
}
