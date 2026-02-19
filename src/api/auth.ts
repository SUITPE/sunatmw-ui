import { api } from './client'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    tenant: { id: string; name: string; ruc: string }
  }
}

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post('/auth/login', credentials)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const error = new Error(errorData?.message || 'Error de autenticacion') as Error & { status: number }
    error.status = response.status
    throw error
  }

  return response.json()
}

export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const response = await api.post('/auth/refresh', { refreshToken: token })

  if (!response.ok) {
    throw new Error('Failed to refresh token')
  }

  return response.json()
}

export async function getMe() {
  const response = await api.get('/auth/me')

  if (!response.ok) {
    throw new Error('Failed to get user info')
  }

  return response.json()
}
