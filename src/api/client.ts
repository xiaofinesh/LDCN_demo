/**
 * Lightweight fetch wrapper.
 * 所有请求走 vite 代理 /api → http://127.0.0.1:4000
 */

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const err: ApiError = new Error((data as { error?: string })?.error ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>('GET', url),
  post: <T>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
  put: <T>(url: string, body?: unknown) => request<T>('PUT', url, body),
  del: <T>(url: string) => request<T>('DELETE', url),
};
