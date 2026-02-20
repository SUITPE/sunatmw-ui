import { api } from './client'
import type { Product, PaginatedResponse } from '@/types'

export interface CreateProductInput {
  code?: string | null
  name: string
  description?: string | null
  unitPrice: string
  unitOfMeasure: string
  igvType: string
  category?: string | null
}

export interface UpdateProductInput {
  code?: string | null
  name?: string
  description?: string | null
  unitPrice?: string
  unitOfMeasure?: string
  igvType?: string
  category?: string | null
  isActive?: boolean
}

export interface GetProductsParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  igvType?: string
}

export async function getProducts(params: GetProductsParams = {}): Promise<PaginatedResponse<Product>> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.search) searchParams.set('search', params.search)
  if (params.category) searchParams.set('category', params.category)
  if (params.igvType) searchParams.set('igvType', params.igvType)

  const query = searchParams.toString()
  const url = `/api/products${query ? `?${query}` : ''}`

  const response = await api.get(url)
  if (!response.ok) throw new Error('Error al obtener productos')
  return response.json()
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await api.post('/api/products', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al crear producto' }))
    throw new Error(err.message || 'Error al crear producto')
  }
  return response.json()
}

export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  const response = await api.patch(`/api/products/${id}`, input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al actualizar producto' }))
    throw new Error(err.message || 'Error al actualizar producto')
  }
  return response.json()
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await api.delete(`/api/products/${id}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al desactivar producto' }))
    throw new Error(err.message || 'Error al desactivar producto')
  }
}

export async function searchProducts(q: string): Promise<Product[]> {
  const response = await api.get(`/api/products/search?q=${encodeURIComponent(q)}`)
  if (!response.ok) throw new Error('Error al buscar productos')
  return response.json()
}
