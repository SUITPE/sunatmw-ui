export interface Tenant {
  id: string
  name: string
  ruc: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'facturador' | 'viewer'
  tenant: Tenant
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export interface Document {
  id: string
  type: string
  series: string
  correlative: number
  documentId: string
  status: string
  cdrResponseCode: string | null
  cdrDescription: string | null
  sunatTicket: string | null
  jsonInput: DocumentInput | null
  createdAt: string
  updatedAt: string
}

export interface DocumentCustomer {
  identityType: string
  identityNumber: string
  name: string
  address?: string
}

export interface DocumentItem {
  code: string
  description: string
  quantity: number
  unitCode: string
  unitPrice: number
  igvType: string
  discount?: number
  iscRate?: number
}

export interface DocumentInput {
  series: string
  correlative: number
  issueDate: string
  dueDate?: string
  currencyCode: string
  customer: DocumentCustomer
  items: DocumentItem[]
  paymentTerms?: string
  observations?: string
  purchaseOrder?: string
  referenceDocumentId?: string
  referenceDocumentType?: string
  responseCode?: string
  responseDescription?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Client {
  id: string
  tenantId: string
  documentType: string
  documentNumber: string
  name: string
  tradeName: string | null
  email: string | null
  phone: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
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
  client: {
    id: string
    name: string
    documentType: string
    documentNumber: string
  } | null
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
}

export interface Product {
  id: string
  tenantId: string
  code: string | null
  name: string
  description: string | null
  unitPrice: string
  unitOfMeasure: string
  igvType: string
  category: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
