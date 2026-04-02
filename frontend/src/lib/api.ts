const API_URL = 'http://localhost:3001';

interface TokenStore {
  accessToken: string | null;
  refreshToken: string | null;
}

const tokens: TokenStore = {
  accessToken: null,
  refreshToken: null,
};

export function setTokens(access: string, refresh: string) {
  tokens.accessToken = access;
  tokens.refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }
}

export function loadTokens() {
  if (typeof window !== 'undefined') {
    tokens.accessToken = localStorage.getItem('accessToken');
    tokens.refreshToken = localStorage.getItem('refreshToken');
  }
}

export function clearTokens() {
  tokens.accessToken = null;
  tokens.refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken() {
  return tokens.accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!tokens.refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) return false;

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  loadTokens();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (tokens.accessToken) {
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
  }

  let res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  // If 401, try refreshing the token
  if (res.status === 401 && tokens.refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
      res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    }
  }

  return res;
}
