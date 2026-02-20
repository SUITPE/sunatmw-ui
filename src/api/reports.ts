import { api } from './client'

export interface DashboardSummary {
  invoicedThisMonth: string
  collectedThisMonth: string
  pendingTotal: string
  overdueTotal: string
}

export interface MonthlyData {
  month: string
  invoiced: number
  collected: number
}

export interface TopDebtor {
  clientName: string
  documentNumber: string
  pendingAmount: number
  invoiceCount: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await api.get('/api/reports/dashboard-summary')
  if (!res.ok) throw new Error('Failed to fetch dashboard summary')
  return res.json()
}

export async function getInvoicedVsCollected(months: number = 6): Promise<MonthlyData[]> {
  const res = await api.get(`/api/reports/invoiced-vs-collected?months=${months}`)
  if (!res.ok) throw new Error('Failed to fetch invoiced vs collected')
  return res.json()
}

export async function getTopDebtors(limit: number = 5): Promise<TopDebtor[]> {
  const res = await api.get(`/api/reports/top-debtors?limit=${limit}`)
  if (!res.ok) throw new Error('Failed to fetch top debtors')
  return res.json()
}
