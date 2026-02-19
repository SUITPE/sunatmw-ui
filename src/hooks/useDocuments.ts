import { useQuery } from '@tanstack/react-query'
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

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id),
    enabled: !!id,
  })
}

export function useDashboardDocuments() {
  return useQuery({
    queryKey: ['documents', 'dashboard'],
    queryFn: () => getDocuments({ page: 1, limit: 10 }),
    staleTime: 5 * 60 * 1000,
  })
}
