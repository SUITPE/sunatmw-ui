import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDocuments, getDocument } from '@/api/documents'

interface UseDocumentsParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  from?: string
  to?: string
}

export function useDocuments(params: UseDocumentsParams = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => getDocuments(params),
    staleTime: 5 * 60 * 1000,
  })
}

const PENDING_STATUSES = ['SENT', 'READY', 'PENDING']

export function useDocument(id: string) {
  const queryClient = useQueryClient()
  const prevStatusRef = useRef<string | undefined>()

  const query = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: !!id,
    // Auto-refresh every 5s when document is in a pending status
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && PENDING_STATUSES.includes(status) ? 5000 : false
    },
  })

  // Detect status changes and invalidate documents list
  useEffect(() => {
    const currentStatus = query.data?.status
    if (prevStatusRef.current && currentStatus && prevStatusRef.current !== currentStatus) {
      // Status changed — invalidate documents list to reflect new status
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    }
    prevStatusRef.current = currentStatus
  }, [query.data?.status, queryClient])

  return query
}

export function useDashboardDocuments() {
  return useQuery({
    queryKey: ['documents', 'dashboard'],
    queryFn: () => getDocuments({ page: 1, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  })
}
