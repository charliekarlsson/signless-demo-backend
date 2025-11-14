const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

async function request(path, options = {}) {
  const { headers, body, ...rest } = options;
  const hasBody = body !== undefined && body !== null;
  const payload = hasBody && typeof body !== 'string' ? JSON.stringify(body) : body;

  const response = await fetch(`${API_BASE_URL}${path}`, {
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
