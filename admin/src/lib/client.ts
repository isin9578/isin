'use client';

export interface ApiResult {
  ok: boolean;
  error?: string;
}

/** Calls an admin API route and normalizes errors. */
export async function apiCall(
  url: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    return res.ok ? { ok: true } : { ok: false, error: json.error ?? 'Request failed.' };
  } catch {
    return { ok: false, error: 'Network error.' };
  }
}
