import { useEffect, useCallback } from 'react'
import { useBlocker, useBeforeUnload } from 'react-router-dom'

/**
 * Blocks in-app navigation (useBlocker) and browser close/refresh (beforeunload)
 * when the form has unsaved changes. Shows a native confirm dialog.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const blocker = useBlocker(isDirty)

  // When blocker triggers, show native confirm
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        'Tienes cambios sin guardar. ¿Seguro que deseas salir?',
      )
      if (confirmed) {
        blocker.proceed()
      } else {
        blocker.reset()
      }
    }
  }, [blocker])

  // Protect against browser close / refresh
  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (isDirty) {
          e.preventDefault()
        }
      },
      [isDirty],
    ),
  )
}
