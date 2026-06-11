export const maxDuration = 300;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').trim();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE}/api/persona/tailored-pitch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
