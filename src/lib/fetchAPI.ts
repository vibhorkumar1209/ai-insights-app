/**
 * Centralized API fetch wrapper with consistent error handling, logging, and timeout.
 * Replaces scattered fetch() calls across the app with a single, configurable utility.
 */

interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeout?: number;
  baseURL?: string;
  notifyError?: boolean; // Whether to show error toast/notification
}

interface FetchResponse<T> {
  data?: T;
  error?: string;
  status: number;
  ok: boolean;
}

/**
 * Centralized fetch with timeout, error handling, and consistent logging
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const {
    timeout = 30000,
    baseURL = typeof window !== 'undefined' ? window.location.origin : '',
    notifyError = true,
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = errorData.error || `API error: ${response.status}`;

      console.error(`[fetchAPI] ${response.status} ${endpoint}:`, error);

      return {
        error,
        status: response.status,
        ok: false,
      };
    }

    // Parse successful response
    const data = await response.json();

    console.debug(`[fetchAPI] ${response.status} ${endpoint}`);

    return {
      data,
      status: response.status,
      ok: true,
    };
  } catch (err) {
    const error =
      err instanceof Error
        ? err.name === 'AbortError'
          ? `Request timeout (${timeout}ms)`
          : err.message
        : 'Unknown error';

    console.error(`[fetchAPI] ${endpoint}:`, error);

    return {
      error,
      status: 0,
      ok: false,
    };
  }
}

/**
 * Helper for POST requests
 */
export async function fetchPost<T>(
  endpoint: string,
  body: unknown,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    body: JSON.stringify(body),
  });
}

/**
 * Helper for GET requests
 */
export async function fetchGet<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<FetchResponse<T>> {
  return fetchAPI<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * Helper for streaming responses (SSE)
 */
export async function fetchStream(
  endpoint: string,
  onData: (event: string, data: unknown) => void,
  options: FetchOptions = {}
): Promise<void> {
  const {
    baseURL = typeof window !== 'undefined' ? window.location.origin : '',
    ...fetchOptions
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      method: 'GET',
    });

    if (!response.ok) {
      const error = `Stream error: ${response.status}`;
      console.error(`[fetchStream] ${endpoint}:`, error);
      onData('error', { error });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[fetchStream] No reader available');
      onData('error', { error: 'No response body' });
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE events
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventText of events) {
        if (!eventText.trim()) continue;

        try {
          const lines = eventText.split('\n');
          let eventType = 'message';
          let data = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              data = line.slice(6);
            }
          }

          if (data) {
            const parsed = JSON.parse(data);
            onData(eventType, parsed);
          }
        } catch (err) {
          console.warn('[fetchStream] Failed to parse SSE event:', err);
        }
      }
    }

    console.debug(`[fetchStream] ${endpoint} completed`);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Stream failed';
    console.error(`[fetchStream] ${endpoint}:`, error);
    onData('error', { error });
  }
}
