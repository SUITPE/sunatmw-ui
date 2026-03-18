const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getMasterKey(): string | null {
  return localStorage.getItem('admin_master_key')
}

async function adminFetch(url: string, options: RequestInit = {}) {
  const masterKey = getMasterKey()
  if (!masterKey) {
    throw new Error('No admin master key configured')
  }

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('Authorization', `Bearer ${masterKey}`)

  const response = await fetch(`${API_URL}${url}`, { ...options, headers })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${response.status}`)
  }

  return response.json()
}

// ─── Types ─────────────────────────────────────────────────────

export interface DashboardData {
  totalTenants: number
  activeTenants: number
  totalDocumentsThisMonth: number
  mrr: number
  currency: string
  topTenants: Array<{
    id: string
    name: string
    ruc: string
    documentsThisMonth: number
  }>
}

export interface AdminTenant {
  id: string
  name: string
  ruc: string
  plan: string
  status: string
  isActive: boolean
  createdAt: string
  suspendedAt: string | null
  documentsThisMonth: number
  lastActive: string | null
}

export interface AdminTenantsResponse {
  data: AdminTenant[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RevenueMonth {
  month: string
  mrr: number
  tenants: number
}

export interface RevenueData {
  months: RevenueMonth[]
}

// ─── API Calls ─────────────────────────────────────────────────

export async function getAdminDashboard(): Promise<DashboardData> {
  return adminFetch('/admin/dashboard')
}

export async function getAdminTenants(params?: {
  search?: string
  plan?: string
  status?: string
  page?: number
  limit?: number
}): Promise<AdminTenantsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set('search', params.search)
  if (params?.plan) searchParams.set('plan', params.plan)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const qs = searchParams.toString()
  return adminFetch(`/admin/tenants-list${qs ? `?${qs}` : ''}`)
}

export async function updateTenantPlan(tenantId: string, plan: string): Promise<AdminTenant> {
  return adminFetch(`/admin/tenants/${tenantId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  })
}

export async function suspendTenant(tenantId: string): Promise<AdminTenant> {
  return adminFetch(`/admin/tenants/${tenantId}/suspend`, {
    method: 'POST',
  })
}

export async function reactivateTenant(tenantId: string): Promise<AdminTenant> {
  return adminFetch(`/admin/tenants/${tenantId}/reactivate`, {
    method: 'POST',
  })
}

export async function getAdminRevenue(): Promise<RevenueData> {
  return adminFetch('/admin/revenue')
}

export function isAdminAuthenticated(): boolean {
  return !!getMasterKey()
}

export function adminLogin(masterKey: string): void {
  localStorage.setItem('admin_master_key', masterKey)
}

export function adminLogout(): void {
  localStorage.removeItem('admin_master_key')
}
