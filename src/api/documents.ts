import { api } from './client'
import type { PaginatedResponse, Document } from '@/types'
import type { EmitResult } from '@/api/invoices'

export interface VoidDocumentInput {
  issueDate: string
  referenceDate: string
  correlative: number
  items: Array<{
    series: string
    correlative: number
    documentType: string
    reason: string
  }>
}

interface DocumentQueryParams {
  page?: number
  limit?: number
  type?: string
  status?: string
  from?: string
  to?: string
}

export async function getDocuments(params: DocumentQueryParams = {}): Promise<PaginatedResponse<Document>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.type) searchParams.set('type', params.type)
  if (params.status) searchParams.set('status', params.status)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)

  const query = searchParams.toString()
  const response = await api.get(`/api/documents${query ? `?${query}` : ''}`)

  if (!response.ok) {
    throw new Error('Failed to fetch documents')
  }

  return response.json()
}

export async function getDocument(id: string): Promise<Document> {
  const response = await api.get(`/api/documents/${id}`)

  if (!response.ok) {
    if (response.status === 404) throw new Error('Document not found')
    throw new Error('Failed to fetch document')
  }

  return response.json()
}

export async function downloadDocumentXml(id: string): Promise<Blob> {
  const response = await api.get(`/api/documents/${id}/xml`)
  if (!response.ok) throw new Error('Failed to download XML')
  return response.blob()
}

export async function downloadDocumentCdr(id: string): Promise<Blob> {
  const response = await api.get(`/api/documents/${id}/cdr`)
  if (!response.ok) throw new Error('Failed to download CDR')
  return response.blob()
}

export async function voidDocument(input: VoidDocumentInput): Promise<EmitResult> {
  const response = await api.post('/api/voided-documents', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al anular documento' }))
    throw new Error(err.message || 'Error al anular documento')
  }
  return response.json()
}

export async function retryDocument(id: string): Promise<Document> {
  const response = await api.post(`/api/documents/${id}/retry`, {})
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al reintentar documento' }))
    throw new Error(err.message || 'Error al reintentar documento')
  }
  return response.json()
}

export async function checkTicket(id: string): Promise<Document> {
  const response = await api.post(`/api/documents/${id}/check-ticket`, {})
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al consultar ticket' }))
    throw new Error(err.message || 'Error al consultar ticket')
  }
  return response.json()
}
