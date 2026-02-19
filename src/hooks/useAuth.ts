import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { login as apiLogin } from '@/api/auth'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, login: storeLogin, logout: storeLogout } = useAuthStore()

  const handleLogin = useCallback(async (email: string, password: string) => {
    const response = await apiLogin({ email, password })
    storeLogin(response.accessToken, response.refreshToken, response.user)
    navigate('/dashboard', { replace: true })
  }, [storeLogin, navigate])

  const handleLogout = useCallback(() => {
    storeLogout()
    navigate('/login', { replace: true })
  }, [storeLogout, navigate])

  return {
    user,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
  }
}
