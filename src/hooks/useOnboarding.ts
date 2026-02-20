import { useCallback, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'

const ONBOARDING_KEY_PREFIX = 'onboarding_completed_'

function getStorageKey(tenantId: string): string {
  return `${ONBOARDING_KEY_PREFIX}${tenantId}`
}

export function useOnboarding() {
  const user = useAuthStore((s) => s.user)
  const tenantId = user?.tenant?.id

  const needsOnboarding = useMemo(() => {
    if (!tenantId) return false
    return localStorage.getItem(getStorageKey(tenantId)) !== 'true'
  }, [tenantId])

  const completeOnboarding = useCallback(() => {
    if (!tenantId) return
    localStorage.setItem(getStorageKey(tenantId), 'true')
  }, [tenantId])

  return {
    needsOnboarding,
    completeOnboarding,
  }
}
