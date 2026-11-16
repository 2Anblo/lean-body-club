import type { Api } from './types';
import { httpApi } from './http';
import { mockApi } from './mock';

/** Set VITE_API_MODE=http in client/.env once the backend is running. */
export const API_MODE: 'mock' | 'http' = import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock';

export const api: Api = API_MODE === 'http' ? httpApi : mockApi;

export { ApiError, errorMessage } from './errors';
export { getToken, setToken, clearToken } from './token';
