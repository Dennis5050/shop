const API_BASE_URL = '/api/v1';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getToken() {
    return localStorage.getItem('nexus_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('nexus_token', token);
    } else {
      localStorage.removeItem('nexus_token');
    }
  }

  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      params = null,
    } = options;

    let url = `${this.baseUrl}/${endpoint.replace(/^\/+/, '')}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const token = this.getToken();
    const requestHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    };

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      method,
      headers: requestHeaders,
      credentials: 'omit',
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE')) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    let data;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(endpoint, params = null) {
    return this.request(endpoint, { method: 'GET', params });
  }

  post(endpoint, body = {}) {
    return this.request(endpoint, { method: 'POST', body });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, { method: 'PATCH', body });
  }

  delete(endpoint, body = null) {
    return this.request(endpoint, { method: 'DELETE', body });
  }
}

export const api = new ApiClient();
export default api;
