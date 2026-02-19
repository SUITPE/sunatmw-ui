import { create } from 'zustand'

interface Tenant {
  id: string
  name: string
  ruc: string
}

interface User {
  id: string
  name: string
  email: string
  role: string
  tenant: Tenant
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (accessToken: string, refreshToken: string, user: User) => void
  logout: () => void
  setTokens: (accessToken: string, refreshToken: string | null) => void
  getAccessToken: () => string | null
  getRefreshToken: () => string | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  login: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user, isAuthenticated: true }),
  logout: () =>
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken: refreshToken ?? get().refreshToken }),
  getAccessToken: () => get().accessToken,
  getRefreshToken: () => get().refreshToken,
}))
