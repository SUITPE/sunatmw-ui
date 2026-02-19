export const IGV_RATE = 0.18

export const IGV_TYPES = {
  GRAVADO: '10',
  EXONERADO: '20',
  INAFECTO: '30',
} as const

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calcLineSubtotal(quantity: number, unitPrice: number, discount: number = 0): number {
  return roundCurrency(quantity * unitPrice - discount)
}

export function calcLineIGV(subtotal: number, igvType: string): number {
  if (igvType !== IGV_TYPES.GRAVADO) return 0
  return roundCurrency(subtotal * IGV_RATE)
}

export function calcLineTotal(subtotal: number, igv: number): number {
  return roundCurrency(subtotal + igv)
}

export interface ItemTotals {
  totalGravadas: number
  totalExoneradas: number
  totalInafectas: number
  totalIGV: number
  totalAmount: number
}

export function calcDocumentTotals(items: Array<{ quantity: number; unitPrice: number; igvType: string; discount?: number }>): ItemTotals {
  let totalGravadas = 0
  let totalExoneradas = 0
  let totalInafectas = 0
  let totalIGV = 0

  for (const item of items) {
    const subtotal = calcLineSubtotal(item.quantity, item.unitPrice, item.discount ?? 0)
    const igv = calcLineIGV(subtotal, item.igvType)

    if (item.igvType === IGV_TYPES.GRAVADO) totalGravadas += subtotal
    else if (item.igvType === IGV_TYPES.EXONERADO) totalExoneradas += subtotal
    else if (item.igvType === IGV_TYPES.INAFECTO) totalInafectas += subtotal
    totalIGV += igv
  }

  return {
    totalGravadas: roundCurrency(totalGravadas),
    totalExoneradas: roundCurrency(totalExoneradas),
    totalInafectas: roundCurrency(totalInafectas),
    totalIGV: roundCurrency(totalIGV),
    totalAmount: roundCurrency(totalGravadas + totalExoneradas + totalInafectas + totalIGV),
  }
}

export function formatCurrency(amount: number, currency: string = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount)
}
