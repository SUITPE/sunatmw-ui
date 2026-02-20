import { api } from './client'
import type { Client, PaginatedResponse } from '@/types'

export interface CreateClientInput {
  documentType: string
  documentNumber: string
  name: string
  tradeName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface UpdateClientInput {
  documentType?: string
  documentNumber?: string
  name?: string
  tradeName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  isActive?: boolean
}

export interface GetClientsParams {
  page?: number
  limit?: number
  search?: string
}

export async function getClients(params: GetClientsParams = {}): Promise<PaginatedResponse<Client>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)

  const query = searchParams.toString()
  const url = `/api/clients${query ? `?${query}` : ''}`

  const response = await api.get(url)
  if (!response.ok) throw new Error('Error al obtener clientes')
  return response.json()
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const response = await api.post('/api/clients', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al crear cliente' }))
    throw new Error(err.message || 'Error al crear cliente')
  }
  return response.json()
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const response = await api.patch(`/api/clients/${id}`, input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al actualizar cliente' }))
    throw new Error(err.message || 'Error al actualizar cliente')
  }
  return response.json()
}

export async function deleteClient(id: string): Promise<void> {
  const response = await api.delete(`/api/clients/${id}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al desactivar cliente' }))
    throw new Error(err.message || 'Error al desactivar cliente')
  }
}

export async function searchClients(q: string): Promise<Client[]> {
  const response = await api.get(`/api/clients/search?q=${encodeURIComponent(q)}`)
  if (!response.ok) throw new Error('Error al buscar clientes')
  return response.json()
}
