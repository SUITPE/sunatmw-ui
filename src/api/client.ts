import { useAuthStore } from '@/stores/auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { getAccessToken, getRefreshToken, setTokens, logout } = useAuthStore.getState()
  const accessToken = getAccessToken()

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response = await fetch(`${API_URL}${url}`, { ...options, headers })

  // If 401, try refresh
  if (response.status === 401 && getRefreshToken()) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: getRefreshToken() }),
    })

    if (refreshResponse.ok) {
      const { accessToken: newToken } = await refreshResponse.json()
      setTokens(newToken, getRefreshToken()!)
      headers.set('Authorization', `Bearer ${newToken}`)
      response = await fetch(`${API_URL}${url}`, { ...options, headers })
    } else {
      logout()
      throw new Error('Session expired')
    }
  }

  return response
}

export const api = {
  get: (url: string) => fetchWithAuth(url),
  post: (url: string, body: unknown) =>
    fetchWithAuth(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: (url: string, body: unknown) =>
    fetchWithAuth(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string) =>
    fetchWithAuth(url, { method: 'DELETE' }),
}
