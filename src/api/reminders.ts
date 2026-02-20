import { api } from './client'

export interface ReminderConfig {
  id: string
  tenantId: string
  type: 'before_due' | 'on_due' | 'after_due'
  daysOffset: number
  subject: string
  body: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateReminderConfigInput {
  subject?: string
  body?: string
  isActive?: boolean
}

export async function getReminderConfigs(): Promise<ReminderConfig[]> {
  const response = await api.get('/api/reminders/configs')
  if (!response.ok) throw new Error('Error al obtener configuraciones de recordatorios')
  return response.json()
}

export async function updateReminderConfig(
  id: string,
  input: UpdateReminderConfigInput
): Promise<ReminderConfig> {
  const response = await api.patch(`/api/reminders/configs/${id}`, input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al actualizar recordatorio' }))
    throw new Error(err.message || 'Error al actualizar recordatorio')
  }
  return response.json()
}
