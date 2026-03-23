import { useCallback } from 'react'
import { useToastStore, type ToastType } from '@/stores/toast.store'

export function useToast() {
  const addToast = useToastStore((s) => s.addToast)

  const toast = useCallback(
    (message: string, type: ToastType = 'success') => addToast(message, type),
    [addToast],
  )

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast])

  return { toast, success, error, info }
}
