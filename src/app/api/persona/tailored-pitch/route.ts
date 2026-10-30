export const maxDuration = 300;

import { BACKEND_URL as API_BASE, internalHeaders } from '@/lib/backendGateway';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE}/api/persona/tailored-pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders(request) },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return Response.json(
        { error: error.error || 'Backend error' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (err) {
    console.error('[api/persona] Error:', err);
    return Response.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
