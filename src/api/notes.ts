import { api } from './client'
import type { EmitResult } from './invoices'

export interface EmitNoteInput {
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
  referenceDocumentId: string
  referenceDocumentType: string
  responseCode: string
  responseDescription: string
  observations?: string
  purchaseOrder?: string
}

export async function emitCreditNote(input: EmitNoteInput): Promise<EmitResult> {
  const response = await api.post('/api/credit-notes', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al emitir nota de credito' }))
    throw new Error(err.message || 'Error al emitir nota de credito')
  }
  return response.json()
}

export async function emitDebitNote(input: EmitNoteInput): Promise<EmitResult> {
  const response = await api.post('/api/debit-notes', input)
  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Error al emitir nota de debito' }))
    throw new Error(err.message || 'Error al emitir nota de debito')
  }
  return response.json()
}
