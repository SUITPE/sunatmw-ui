import { api } from './client'
import type { AuthResponse } from '@/types'

interface LoginRequest {
  email: string
  password: string
  ruc: string
}

interface RegisterRequest {
  email: string
  password: string
  companyName: string
  ruc: string
}

interface VerifyEmailRequest {
  email: string
  code: string
}

interface ResendVerificationRequest {
  email: string
}

function handleApiError(response: Response, errorData: { message?: string } | null): never {
  const error = new Error(errorData?.message || 'Error en la solicitud') as Error & { status: number }
  error.status = response.status
  throw error
}

export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await api.post('/auth/login', credentials)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
  }

  return response.json()
}

export async function register(data: RegisterRequest): Promise<{ message: string }> {
  const response = await api.post('/auth/register', data)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
  }

  return response.json()
}

export async function verifyEmail(data: VerifyEmailRequest): Promise<{ message: string }> {
  const response = await api.post('/auth/verify-email', data)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
  }

  return response.json()
}

export async function resendVerification(data: ResendVerificationRequest): Promise<{ message: string }> {
  const response = await api.post('/auth/resend-verification', data)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
  }

  return response.json()
}

interface ForgotPasswordRequest {
  email: string
  ruc: string
}

interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  const response = await api.post('/auth/forgot-password', data)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
  }

  return response.json()
}

export async function resetPassword(data: ResetPasswordRequest): Promise<{ message: string }> {
  const response = await api.post('/auth/reset-password', data)

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    handleApiError(response, errorData)
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
