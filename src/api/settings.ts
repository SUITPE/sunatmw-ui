import { api } from './client'

export interface TenantSettings {
  id: string
  name: string
  ruc: string
  solUser: string
  hasCertificate: boolean
  isActive: boolean
}

export async function getTenantSettings(): Promise<TenantSettings> {
  const res = await api.get('/api/settings/tenant')
  if (!res.ok) throw new Error('Error al obtener configuracion')
  return res.json()
}

export async function uploadCertificate(certificate: string, certPassword: string) {
  const res = await api.put('/api/settings/certificate', { certificate, certPassword })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al subir certificado')
  }
  return res.json()
}

export async function updateSunatCredentials(solUser: string, solPassword: string) {
  const res = await api.put('/api/settings/sunat-credentials', { solUser, solPassword })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al actualizar credenciales')
  }
  return res.json()
}
