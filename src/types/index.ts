export interface Tenant {
  id: string
  name: string
  ruc: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'facturador' | 'viewer'
  tenant: Tenant
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
