import { api } from './client'

export interface ReceivableClient {
  id: string
  name: string
  documentType: string
  documentNumber: string
}

export interface Receivable {
  id: string
  tenantId: string
  clientId: string | null
  documentId: string
  invoiceNumber: string
  totalAmount: string
  paidAmount: string
  balanceAmount: string
  currency: string
  issueDate: string
  dueDate: string
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'written_off'
  lastReminderAt: string | null
  reminderCount: number
  createdAt: string
  updatedAt: string
  client: ReceivableClient | null
}

export interface ReceivableSummary {
  totalPending: string
  totalOverdue: string
  totalPaidThisMonth: string
  count: Record<string, number>
}

export interface AgingReport {
  buckets: Record<string, number>
  counts: Record<string, number>
}

export interface RegisterPaymentInput {
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
  notes?: string
}

export interface Payment {
  id: string
  tenantId: string
  receivableId: string
  amount: string
  paymentDate: string
  paymentMethod: string
  reference: string | null
  notes: string | null
  createdAt: string
  receivable?: {
    id: string
    invoiceNumber: string
    totalAmount: string
    paidAmount: string
    balanceAmount: string
    status: string
  }
}

export interface GetReceivablesParams {
  page?: number
  limit?: number
  status?: string
  clientId?: string
  from?: string
  to?: string
}

export interface PaginatedReceivables {
  data: Receivable[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedPayments {
  data: Payment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getReceivables(params: GetReceivablesParams = {}): Promise<PaginatedReceivables> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))
  if (params.status) searchParams.set('status', params.status)
  if (params.clientId) searchParams.set('clientId', params.clientId)
  if (params.from) searchParams.set('from', params.from)
  if (params.to) searchParams.set('to', params.to)

  const query = searchParams.toString()
  const url = `/api/receivables${query ? `?${query}` : ''}`

  const response = await api.get(url)
  if (!response.ok) throw new Error('Error al obtener cuentas por cobrar')
  return response.json()
}

export async function getReceivableSummary(): Promise<ReceivableSummary> {
  const response = await api.get('/api/receivables/summary')
  if (!response.ok) throw new Error('Error al obtener resumen de cobranza')
  return response.json()
}

export async function getAgingReport(): Promise<AgingReport> {
  const response = await api.get('/api/receivables/aging')
  if (!response.ok) throw new Error('Error al obtener reporte de antigüedad')
  return response.json()
}

export async function registerPayment(receivableId: string, input: RegisterPaymentInput): Promise<Payment> {
  const response = await api.post(`/api/receivables/${receivableId}/payments`, input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al registrar pago' }))
    throw new Error(err.message || 'Error al registrar pago')
  }
  return response.json()
}

export async function getPayments(receivableId: string, params: { page?: number; limit?: number } = {}): Promise<PaginatedPayments> {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.limit) searchParams.set('limit', String(params.limit))

  const query = searchParams.toString()
  const url = `/api/receivables/${receivableId}/payments${query ? `?${query}` : ''}`

  const response = await api.get(url)
  if (!response.ok) throw new Error('Error al obtener pagos')
  return response.json()
}

export async function deletePayment(paymentId: string): Promise<void> {
  const response = await api.delete(`/api/payments/${paymentId}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al anular pago' }))
    throw new Error(err.message || 'Error al anular pago')
  }
}
