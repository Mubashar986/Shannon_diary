const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface Entity {
  id: string;
  user_id?: string;
  title: string;
  content?: string;
  category?: string;
  status?: string;
  metadata?: Record<string, any>;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export async function fetchEntities(category?: string): Promise<Entity[]> {
  try {
    const url = new URL(`${API_BASE}/entities`);
    if (category) url.searchParams.set('category', category);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Backend fetch failed, returning empty list:', err);
    return [];
  }
}

export async function createEntity(data: Partial<Entity>): Promise<Entity | null> {
  try {
    const res = await fetch(`${API_BASE}/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to create entity:', err);
    return null;
  }
}

export async function askAI(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/ai/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.result;
  } catch (err) {
    return 'Dev Mode: AI Copilot endpoint is offline or processing. Backend fallback active.';
  }
}
