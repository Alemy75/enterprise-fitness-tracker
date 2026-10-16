const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
  'host',
  'cookie',
  'content-length',
]);

function apiBaseUrl(): string {
  return process.env['API_INTERNAL_URL'] ?? 'http://127.0.0.1:3001';
}

/**
 * Forwards a browser request to the NestJS API over the internal network (ADR-19).
 * Cookies never reach the API: EFT-141 will swap the session cookie for an access token here.
 */
export async function proxyToApi(request: Request, apiPath: string): Promise<Response> {
  const source = new URL(request.url);
  const target = new URL(apiPath + source.search, apiBaseUrl());

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : null,
      signal: AbortSignal.timeout(30_000),
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return Response.json(
      { type: 'https://errors.eft.local/upstream', title: 'API unavailable', status: 502 },
      { status: 502, headers: { 'content-type': 'application/problem+json' } },
    );
  }
}
