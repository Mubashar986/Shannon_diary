/**
 * NovaWorks CRM API Client.
 * Connects to the FastAPI backend with role-based JWT session tokens.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export type Role = 'ADMIN' | 'MANAGER' | 'AGENT';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  specialization: string;
  skills: string[];
}

export interface Task {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  description?: string;
  assignee_id: string;
  assignee_name?: string;
  deadline: string;
  estimated_hours: number;
}

export interface Project {
  id: string;
  name: string;
  client_name: string;
  description?: string;
  manager_id: string;
  manager_name?: string;
  deadline: string;
  task_count: number;
  total_hours: number;
}

export interface ProjectDetail extends Project {
  tasks: Task[];
}

export interface TranscriptResponse {
  message: string;
  projects_created: number;
  tasks_created: number;
  projects: Project[];
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('novaworks_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      errorMsg = body.detail || body.message || errorMsg;
    } catch {
      // fallback text
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonStringify({ email, password }),
  });
  const data = await handleResponse<{ token: string; user: UserProfile }>(res);
  localStorage.setItem('novaworks_token', data.token);
  localStorage.setItem('novaworks_user', JSON.stringify(data.user));
  return data;
}

export function logout(): void {
  localStorage.removeItem('novaworks_token');
  localStorage.removeItem('novaworks_user');
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem('novaworks_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<UserProfile>(res);
}

export async function getTeam(): Promise<UserProfile[]> {
  const res = await fetch(`${API_BASE}/team`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<UserProfile[]>(res);
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Project[]>(res);
}

export async function getProjectDetail(id: string): Promise<ProjectDetail> {
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<ProjectDetail>(res);
}

export async function getTasks(projectId?: string): Promise<Task[]> {
  const url = projectId ? `${API_BASE}/tasks?project_id=${projectId}` : `${API_BASE}/tasks`;
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  return handleResponse<Task[]>(res);
}

export async function createFromTranscript(transcript: string): Promise<TranscriptResponse> {
  const res = await fetch(`${API_BASE}/projects/create-from-transcript`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
    },
    body: JSON.stringify({ transcript }),
  });
  return handleResponse<TranscriptResponse>(res);
}

export async function resetDemo(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/projects/reset`, {
    method: 'POST',
    headers: { ...getAuthHeader() },
  });
  return handleResponse<{ message: string }>(res);
}

function jsonStringify(obj: any): string {
  return JSON.stringify(obj);
}
