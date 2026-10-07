import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Entity {
  id: string;
  user_id?: string;
  title: string;
  content?: string;
  category?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function getSessionToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Every failure throws. Callers render the error; nothing here returns an empty
 * list or a fabricated row, because a demo that looks loaded but is not is worse
 * than a visible error.
 */
async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  } catch {
    throw new ApiError('Backend unreachable — is uvicorn running on port 8000?');
  }

  if (res.status === 204) return null as T;

  const raw = await res.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const detail =
      (body as { detail?: string } | null)?.detail ||
      (raw.startsWith('<') ? `Backend returned HTML for ${path} (wrong base URL?)` : `HTTP ${res.status}`);
    throw new ApiError(detail, res.status);
  }
  return body as T;
}

export async function fetchEntities(category?: string, limit = 50): Promise<Entity[]> {
  const token = await getSessionToken();
  const qs = new URLSearchParams({ limit: String(limit) });
  if (category) qs.set('category', category);
  return request<Entity[]>(`/entities?${qs.toString()}`, { method: 'GET' }, token ?? undefined);
}

export async function createEntity(data: {
  title: string;
  content?: string;
  category?: string;
  status?: string;
  is_public?: boolean;
}): Promise<Entity> {
  const token = await getSessionToken();
  if (!token) throw new ApiError('Not signed in', 401);
  return request<Entity>('/entities', { method: 'POST', body: JSON.stringify(data) }, token);
}

export async function updateEntity(id: string, data: Partial<Entity>): Promise<Entity> {
  const token = await getSessionToken();
  if (!token) throw new ApiError('Not signed in', 401);
  return request<Entity>(`/entities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token);
}

export async function deleteEntity(id: string): Promise<void> {
  const token = await getSessionToken();
  if (!token) throw new ApiError('Not signed in', 401);
  return request<void>(`/entities/${id}`, { method: 'DELETE' }, token);
}

export async function askAI(prompt: string, model = 'gemini-2.5-flash'): Promise<string> {
  const token = await getSessionToken();
  if (!token) throw new ApiError('Not signed in', 401);
  const data = await request<{ result: string }>('/ai/complete', {
    method: 'POST',
    body: JSON.stringify({ prompt, model }),
  }, token);
  return data.result;
}
