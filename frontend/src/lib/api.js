const DEV_DEFAULT_URL = 'http://localhost:3000';

const normalizeUrl = (url) => url.replace(/\/+$/, '');

const resolveRuntimeOverride = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const directOverride = window.SIGNLESS_API_URL || window.__SIGNLESS_API_URL__;
  if (directOverride && typeof directOverride === 'string') {
    return directOverride;
  }

  const configOverride = window.__SIGNLESS_CONFIG__?.apiUrl;
  if (configOverride && typeof configOverride === 'string') {
    return configOverride;
  }

  return undefined;
};

const resolveBaseUrl = () => {
  const envUrl = typeof import.meta.env.VITE_API_URL === 'string'
    ? import.meta.env.VITE_API_URL.trim()
    : '';

  if (envUrl) {
    return normalizeUrl(envUrl);
  }

  const runtimeOverride = resolveRuntimeOverride();
  if (runtimeOverride) {
    return normalizeUrl(runtimeOverride.trim());
  }

  if (import.meta.env.DEV) {
    console.warn('[signless] VITE_API_URL not set. Falling back to local dev backend at http://localhost:3000');
    return DEV_DEFAULT_URL;
  }

  console.error('[signless] Missing VITE_API_URL in production. Requests will default to same-origin paths.');
  return '';
};

const API_BASE_URL = resolveBaseUrl();

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const buildUrl = (path) => {
  if (!API_BASE_URL) {
    return path;
  }

  if (!path.startsWith('/') && !API_BASE_URL.endsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};

async function request(path, options = {}) {
  const { headers, body, ...rest } = options;
  const hasBody = body !== undefined && body !== null;
  const payload = hasBody && typeof body !== 'string' ? JSON.stringify(body) : body;

  const response = await fetch(buildUrl(path), {
    method: 'GET',
    credentials: 'include',
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers
    },
    body: payload
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' })
};

export { API_BASE_URL };
