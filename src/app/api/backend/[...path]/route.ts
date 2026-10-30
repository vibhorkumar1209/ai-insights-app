// Same-origin gateway from this app's browser code to the insights API.
// /api/backend/api/<module>/... → <BACKEND_URL>/api/<module>/...
//
// Why it exists is in src/lib/backendGateway.ts. In short: the API redacts
// sources and methodology for every caller without INTERNAL_API_TOKEN, and only
// this server can hold that token.
//
// Everything is passed through as-is — status codes included, because the job
// pollers and the lost-job snapshot rely on a 200 carrying status:"error"
// rather than a 404 — and response bodies are streamed, never buffered, so
// EventSource progress arrives as the API sends it.

import type { NextRequest } from 'next/server';
import { BACKEND_URL, internalHeaders } from '@/lib/backendGateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// A report job's SSE stream stays open while it runs. Past this limit Vercel
// closes it; useJobManager then falls back to polling the job snapshot.
export const maxDuration = 300;

const REQUEST_HEADERS = ['content-type', 'accept', 'last-event-id'];
const RESPONSE_HEADERS = [
  'content-type',
  'content-disposition',
  'cache-control',
  'retry-after',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
  'ratelimit-policy',
];

async function proxy(req: NextRequest, { params }: { params: { path?: string[] } }): Promise<Response> {
  const segments = params.path ?? [];
  // Only the API's own routes; nothing that walks out of /api.
  if (segments[0] !== 'api' || segments.some((s) => s === '' || s === '.' || s === '..')) {
    return Response.json({ error: 'Route not found' }, { status: 404 });
  }
  const target = `${BACKEND_URL}/${segments.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  const headers = new Headers(internalHeaders(req));
  for (const name of REQUEST_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer(),
      // Closing the page closes the upstream stream too, instead of holding it open.
      signal: req.signal,
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch (err) {
    if (req.signal.aborted) return new Response(null, { status: 499 });
    console.error('[api/backend] upstream unreachable:', target, err instanceof Error ? err.message : err);
    return Response.json(
      { error: 'The insights service is starting up or unreachable. Try again in a minute.' },
      { status: 502 }
    );
  }

  const out = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) out.set(name, value);
  }
  if (out.get('content-type')?.includes('text/event-stream')) {
    // no-transform keeps intermediaries from compressing (and so buffering) the stream.
    out.set('cache-control', 'no-cache, no-transform');
    out.set('x-accel-buffering', 'no');
  }

  const bodyless = upstream.status === 204 || upstream.status === 304 || req.method === 'HEAD';
  return new Response(bodyless ? null : upstream.body, { status: upstream.status, headers: out });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
