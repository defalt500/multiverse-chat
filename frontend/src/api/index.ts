// src/api/index.ts
// If VITE_API_URL is set, use it. Otherwise auto-detect from the current hostname
// so the app works from both localhost (PC) and LAN IP (mobile) without changing .env
const BASE_URL = import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:5000/api`;

export const getAuthToken = (): string | null => {
    return localStorage.getItem('firebase_token')
};

export const setAuthToken = (token: string) => {
    localStorage.setItem('firebase_token', token)
};

export const clearAuthToken = () => {
    localStorage.removeItem('firebase_token');
};

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    // 15-second timeout so login never hangs forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(data?.error || `API error ${response.status}`);
        }

        return data;
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Connection timeout — check backend is running');
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
};
