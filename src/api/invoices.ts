import { api } from './client'

export interface EmitInvoiceInput {
  series: string
  correlative: number
  issueDate: string
  dueDate?: string
  currencyCode: string
  customer: {
    identityType: string
    identityNumber: string
    name: string
    address?: string
  }
  items: Array<{
    code: string
    description: string
    quantity: number
    unitCode: string
    unitPrice: number
    igvType: string
    discount?: number
  }>
  observations?: string
  purchaseOrder?: string
}

export interface EmitResult {
  id: string
  documentId: string
  status: string
  cdr?: {
    responseCode: string
    description: string
    notes?: string[]
  }
  sunatHash?: string
  error?: string
}

export async function emitInvoice(input: EmitInvoiceInput): Promise<EmitResult> {
  const response = await api.post('/api/invoices', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al emitir factura' }))
    throw new Error(err.message || 'Error al emitir factura')
  }
  return response.json()
}

export async function emitReceipt(input: EmitInvoiceInput): Promise<EmitResult> {
  const response = await api.post('/api/receipts', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al emitir boleta' }))
    throw new Error(err.message || 'Error al emitir boleta')
  }
  return response.json()
}
