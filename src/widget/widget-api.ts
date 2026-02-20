// ---------------------------------------------------------------------------
// Standalone API client for the <sunat-widget> Web Component.
// Does NOT depend on auth stores — uses the API key passed via attribute.
// ---------------------------------------------------------------------------

export interface WidgetEmitInput {
  series: string
  correlative: number
  issueDate: string
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
}

export interface WidgetEmitResult {
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

async function postJSON(
  apiUrl: string,
  apiKey: string,
  path: string,
  body: unknown,
): Promise<WidgetEmitResult> {
  const url = `${apiUrl.replace(/\/+$/, '')}${path}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: { message?: string } = await response
      .json()
      .catch(() => ({ message: `Error HTTP ${response.status}` }))
    throw new Error(err.message ?? `Error HTTP ${response.status}`)
  }

  return response.json() as Promise<WidgetEmitResult>
}

export function emitInvoice(
  apiUrl: string,
  apiKey: string,
  input: WidgetEmitInput,
): Promise<WidgetEmitResult> {
  return postJSON(apiUrl, apiKey, '/api/invoices', input)
}

export function emitReceipt(
  apiUrl: string,
  apiKey: string,
  input: WidgetEmitInput,
): Promise<WidgetEmitResult> {
  return postJSON(apiUrl, apiKey, '/api/receipts', input)
}
