import { api } from './client'
import type { User } from '@/types'

export interface CreateUserInput {
  email: string
  password: string
  name: string
  role: 'admin' | 'facturador' | 'viewer'
}

export interface UpdateUserInput {
  name?: string
  role?: 'admin' | 'facturador' | 'viewer'
  isActive?: boolean
}

export async function getUsers(): Promise<User[]> {
  const response = await api.get('/admin/users')
  if (!response.ok) throw new Error('Failed to fetch users')
  return response.json()
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await api.post('/admin/users', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al crear usuario' }))
    throw new Error(err.message || 'Error al crear usuario')
  }
  return response.json()
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const response = await api.patch(`/admin/users/${id}`, input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al actualizar usuario' }))
    throw new Error(err.message || 'Error al actualizar usuario')
  }
  return response.json()
}

export async function deleteUser(id: string): Promise<void> {
  const response = await api.delete(`/admin/users/${id}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al desactivar usuario' }))
    throw new Error(err.message || 'Error al desactivar usuario')
  }
}
