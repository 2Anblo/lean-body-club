// REST client for the real backend. Endpoints and payloads are documented in docs/api.md.
import type { Api } from './types';
import { ApiError } from './errors';
import { getToken } from './token';

const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Can’t reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { message?: string } | null)?.message ?? `Request failed (${res.status}).`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

const enc = encodeURIComponent;

export const httpApi: Api = {
  signIn: (email, password) => request('POST', '/auth/login', { email, password }),
  signUp: (input) => request('POST', '/auth/signup', input),
  me: () => request('GET', '/auth/me'),
  signOut: () => request('POST', '/auth/logout'),
  updateMe: (patch) => request('PATCH', '/users/me', patch),
  myWeek: () => request('GET', '/users/me/week'),

  listGroups: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.category) qs.set('category', params.category);
    const query = qs.toString();
    return request('GET', `/groups${query ? `?${query}` : ''}`);
  },
  getGroup: (id) => request('GET', `/groups/${enc(id)}`),
  joinGroup: (id) => request('POST', `/groups/${enc(id)}/members`),
  leaveGroup: (id) => request('DELETE', `/groups/${enc(id)}/members/me`),
  groupFeed: (id) => request('GET', `/groups/${enc(id)}/checkins`),
  homeFeed: () => request('GET', '/checkins/feed'),

  createCheckIn: (input) => request('POST', '/checkins', input),
  getCheckIn: (id) => request('GET', `/checkins/${enc(id)}`),
  likeCheckIn: (id) => request('POST', `/checkins/${enc(id)}/like`),
  unlikeCheckIn: (id) => request('DELETE', `/checkins/${enc(id)}/like`),

  listComments: (checkInId) => request('GET', `/checkins/${enc(checkInId)}/comments`),
  addComment: (checkInId, text) => request('POST', `/checkins/${enc(checkInId)}/comments`, { text }),
};
