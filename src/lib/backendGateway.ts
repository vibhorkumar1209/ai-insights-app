// Server-only helpers for calling the insights API on behalf of this app.
//
// The API strips sources, citations and methodology from every response unless
// the request carries INTERNAL_API_TOKEN — that is what keeps them out of the
// Claude MCP and any other outside integration. This app's own pages do show
// source links, so its requests need the token, and a browser cannot hold a
// secret. Browser code therefore never calls the API directly: it calls this
// app's /api/backend proxy, which attaches the token on the server.
//
// Never import this file from client components — INTERNAL_API_TOKEN must not
// reach the browser bundle (it is deliberately not a NEXT_PUBLIC_ variable).

export const BACKEND_URL = (process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
  .trim()
  .replace(/\/+$/, '');

/**
 * Whether a request to this app's server came from this app's own pages.
 *
 * Browsers stamp every fetch, EventSource and navigation with Sec-Fetch-Site,
 * and page scripts cannot change it. Browsers that predate Fetch Metadata
 * (Safari before 16.4) fall back to the Referer host. A script can forge both,
 * so this is not authentication — the app has no login, and anyone can read
 * sources in its UI anyway. What it does guarantee is that an integration
 * pointed at this proxy, rather than at the API, still gets the redacted output
 * unless it deliberately impersonates a browser.
 */
export function isFromThisApp(req: Request): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const referer = req.headers.get('referer');
  const host = req.headers.get('host');
  if (!referer || !host) return false;
  try {
    return new URL(referer).host === host;
  } catch {
    return false;
  }
}

/** The visitor's IP as Vercel reports it, so the API rate-limits per visitor, not per Vercel egress IP. */
export function visitorIp(req: Request): string | undefined {
  return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
}

/** Headers that mark a server-side call to the API as this app's own. */
export function internalHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = process.env.INTERNAL_API_TOKEN;
  if (token && isFromThisApp(req)) headers['x-internal-token'] = token;
  const ip = visitorIp(req);
  if (ip) headers['x-forwarded-for'] = ip;
  return headers;
}
