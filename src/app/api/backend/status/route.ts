// GET /api/backend/status — is the API proxy wired up correctly?
//
// The proxy only gets full payloads (source links included) when three things
// line up: this deployment has INTERNAL_API_TOKEN, the request is recognised as
// coming from this app's own pages, and the API holds the same token. When the
// app silently falls back to the redacted view, nothing errors, so this route
// reports each condition as a yes/no. It never returns the token or any part of
// it, and it serves no report data.
//
// A static segment, so it wins over the [...path] catch-all beside it.

import type { NextRequest } from 'next/server';
import { BACKEND_URL, isFromThisApp } from '@/lib/backendGateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<Response> {
  const token = process.env.INTERNAL_API_TOKEN;
  const tokenConfigured = Boolean(token);

  // An internal-only API route: 200 when the API accepts our token, 404 when it
  // treats us as an outside caller. Tells a missing token on Render, or a
  // different value there, apart from a problem on this side.
  let apiAcceptsToken: boolean | null = null;
  let apiCheckStatus: number | string | null = null;
  if (token) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/archive-stats`, {
        headers: { 'x-internal-token': token },
        cache: 'no-store',
      });
      apiCheckStatus = res.status;
      apiAcceptsToken = res.status === 200;
    } catch (err) {
      apiCheckStatus = err instanceof Error ? `unreachable: ${err.message}` : 'unreachable';
    }
  }

  let backendHost: string | null = null;
  try {
    backendHost = new URL(BACKEND_URL).host;
  } catch {
    backendHost = null;
  }

  return Response.json(
    {
      deployment: process.env.VERCEL_ENV ?? 'local',
      backendHost,
      tokenConfigured,
      // Pasting a value often brings a trailing newline or space with it, and a
      // token with one never matches the API's copy.
      tokenHasSurroundingWhitespace: token ? token !== token.trim() : null,
      apiAcceptsToken,
      apiCheckStatus,
      request: {
        secFetchSite: req.headers.get('sec-fetch-site'),
        refererPresent: Boolean(req.headers.get('referer')),
        fromThisApp: isFromThisApp(req),
      },
    },
    { headers: { 'cache-control': 'no-store' } }
  );
}
