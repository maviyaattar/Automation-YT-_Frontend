/**
 * api.js — Centralized API wrapper
 * Base URL: configured via VITE_API_BASE_URL environment variable.
 * Uses fetch with credentials: 'include' for cookie-based auth.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://automation-yt-saas.onrender.com').replace(/\/$/, '');
const DEFAULT_TIMEOUT = 30000; // 30s

/**
 * Core fetch wrapper with AbortController timeout,
 * consistent error handling, and credentials.
 */
async function request(method, path, { body, timeout = DEFAULT_TIMEOUT, signal: externalSignal } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Merge external signal if provided
  const signal = externalSignal
    ? (() => {
        externalSignal.addEventListener('abort', () => controller.abort());
        return controller.signal;
      })()
    : controller.signal;

  const options = {
    method,
    credentials: 'include',
    signal,
    headers: {},
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, options);
    clearTimeout(timer);

    // Try to parse JSON; fall back to text
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (!res.ok) {
      const message = (typeof data === 'object' && data?.message)
        ? data.message
        : (typeof data === 'string' && data) || `HTTP ${res.status}`;
      throw new ApiError(message, res.status, data);
    }

    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408, null);
    }
    if (err instanceof ApiError) throw err;
    // Network/fetch error
    throw new ApiError(
      err.message || 'Network error. Please check your connection.',
      0,
      null
    );
  }
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Shorthand methods
const get = (path, opts) => request('GET', path, opts || {});
const post = (path, body, opts) => request('POST', path, { body, ...(opts || {}) });
const patch = (path, body, opts) => request('PATCH', path, { body, ...(opts || {}) });
const del = (path, opts) => request('DELETE', path, opts || {});

/* ---- Auth ---- */
export const auth = {
  /** Redirect to Google OAuth (full page redirect) */
  loginWithGoogle() {
    window.location.href = `${BASE_URL}/auth/google`;
  },

  /** Check authentication status */
  status() {
    return get('/auth/status');
  },

  /** Logout */
  logout() {
    return post('/auth/logout');
  },
};

/* ---- Dashboard ---- */
export const dashboard = {
  get() {
    return get('/dashboard');
  },
};

/* ---- Generate ---- */
export const generate = {
  run(payload) {
    return post('/generate', payload, { timeout: 120000 });
  },
};

/* ---- Auto Mode ---- */
export const auto = {
  set(payload) {
    return post('/auto', payload);
  },
};

/* ---- Logs ---- */
export const logs = {
  get() {
    return get('/logs');
  },
  clear() {
    return del('/logs');
  },
};

/* ---- Profile ---- */
export const profile = {
  get() {
    return get('/profile');
  },
  update(payload) {
    return patch('/profile', payload);
  },
};

/* ---- Disconnect ---- */
export const disconnect = {
  run() {
    return post('/disconnect');
  },
};
