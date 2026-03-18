import { api } from './client'

export interface BillingPlan {
  name: string
  displayName: string
  price: number | null
  currency: string
  documentLimit: number | null
  userLimit: number | null
  features: string[]
}

export interface BillingSubscription {
  status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'incomplete' | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface BillingInfo {
  plan: string
  subscription: BillingSubscription | null
  nextBillingDate: string | null
}

export interface UsageInfo {
  month: string
  documentCount: number
  limit: number | null
  plan: string
  remaining: number | null
  percentage: number
}

export async function getBillingInfo(): Promise<BillingInfo> {
  const res = await api.get('/api/billing')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener informacion de facturacion')
  }
  return res.json()
}

export async function getUsage(): Promise<UsageInfo> {
  const res = await api.get('/api/usage')
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al obtener uso del mes')
  }
  return res.json()
}

export async function createCheckoutSession(plan: string): Promise<{ url: string }> {
  const res = await api.post('/api/billing/checkout', { plan })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al crear sesion de pago')
  }
  return res.json()
}

export async function createPortalSession(): Promise<{ url: string }> {
  const res = await api.post('/api/billing/portal', {})
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Error al abrir portal de facturacion')
  }
  return res.json()
}
