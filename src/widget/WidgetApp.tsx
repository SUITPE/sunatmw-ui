import { useState, useMemo, useCallback } from 'react'
import {
  calcLineSubtotal,
  calcLineIGV,
  calcLineTotal,
  calcDocumentTotals,
  formatCurrency,
  IGV_TYPES,
} from '../lib/calculations'
import { emitInvoice, emitReceipt } from './widget-api'
import type { WidgetEmitInput, WidgetEmitResult } from './widget-api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WidgetProps {
  apiKey: string
  apiUrl: string
  host: HTMLElement // the custom element, used to dispatch events
}

interface WidgetItem {
  id: string
  description: string
  quantity: number
  unitCode: string
  unitPrice: number
  igvType: string
}

interface WidgetFormState {
  documentType: '01' | '03'
  series: string
  correlative: number
  issueDate: string
  currencyCode: string
  customerDocType: string
  customerDocNumber: string
  customerName: string
  customerAddress: string
  items: WidgetItem[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function createEmptyItem(): WidgetItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unitCode: 'NIU',
    unitPrice: 0,
    igvType: IGV_TYPES.GRAVADO,
  }
}

function createInitialState(): WidgetFormState {
  return {
    documentType: '01',
    series: 'F001',
    correlative: 1,
    issueDate: todayISO(),
    currencyCode: 'PEN',
    customerDocType: '6',
    customerDocNumber: '',
    customerName: '',
    customerAddress: '',
    items: [createEmptyItem()],
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(s: WidgetFormState): string | null {
  if (!s.series.trim()) return 'La serie es obligatoria'
  if (s.correlative < 1) return 'El correlativo debe ser mayor a 0'
  if (!s.issueDate) return 'La fecha de emision es obligatoria'
  if (!s.customerDocNumber.trim()) return 'El numero de documento del cliente es obligatorio'
  if (s.customerDocType === '6' && s.customerDocNumber.length !== 11)
    return 'El RUC debe tener 11 digitos'
  if (s.customerDocType === '1' && s.customerDocNumber.length !== 8)
    return 'El DNI debe tener 8 digitos'
  if (!/^\d+$/.test(s.customerDocNumber))
    return 'El numero de documento solo debe contener digitos'
  if (!s.customerName.trim()) return 'El nombre del cliente es obligatorio'
  if (s.items.length === 0) return 'Debe agregar al menos un item'
  for (let i = 0; i < s.items.length; i++) {
    const item = s.items[i]!
    if (!item.description.trim()) return `Item ${i + 1}: la descripcion es obligatoria`
    if (item.quantity <= 0) return `Item ${i + 1}: la cantidad debe ser mayor a 0`
    if (item.unitPrice <= 0) return `Item ${i + 1}: el precio unitario debe ser mayor a 0`
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WidgetApp({ apiKey, apiUrl, host }: WidgetProps) {
  const [form, setForm] = useState<WidgetFormState>(createInitialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WidgetEmitResult | null>(null)

  const totals = useMemo(() => calcDocumentTotals(form.items), [form.items])

  // -----------------------------------------------------------------------
  // Form updaters
  // -----------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof WidgetFormState>(key: K, value: WidgetFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setError(null)
    },
    [],
  )

  const updateDocType = useCallback((value: '01' | '03') => {
    setForm((prev) => ({
      ...prev,
      documentType: value,
      series: value === '01' ? 'F001' : 'B001',
      customerDocType: value === '01' ? '6' : '1',
      customerDocNumber: '',
    }))
    setError(null)
  }, [])

  const updateItem = useCallback(
    (id: string, field: keyof WidgetItem, value: string | number) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === id ? { ...item, [field]: value } : item,
        ),
      }))
      setError(null)
    },
    [],
  )

  const addItem = useCallback(() => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }, [])

  // -----------------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const validationError = validate(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const payload: WidgetEmitInput = {
      series: form.series.trim(),
      correlative: form.correlative,
      issueDate: form.issueDate,
      currencyCode: form.currencyCode,
      customer: {
        identityType: form.customerDocType,
        identityNumber: form.customerDocNumber.trim(),
        name: form.customerName.trim(),
        ...(form.customerAddress.trim()
          ? { address: form.customerAddress.trim() }
          : {}),
      },
      items: form.items.map((item, idx) => ({
        code: `ITEM-${String(idx + 1).padStart(3, '0')}`,
        description: item.description,
        quantity: item.quantity,
        unitCode: item.unitCode,
        unitPrice: item.unitPrice,
        igvType: item.igvType,
      })),
    }

    try {
      const emitFn = form.documentType === '01' ? emitInvoice : emitReceipt
      const res = await emitFn(apiUrl, apiKey, payload)
      setResult(res)

      // Dispatch custom event to host element
      host.dispatchEvent(
        new CustomEvent('on-issued', {
          bubbles: true,
          composed: true,
          detail: {
            documentId: res.documentId,
            status: res.status,
            id: res.id,
          },
        }),
      )
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error desconocido al emitir'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [form, apiUrl, apiKey, host])

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const handleReset = useCallback(() => {
    setForm(createInitialState())
    setError(null)
    setResult(null)
    setLoading(false)
  }, [])

  // -----------------------------------------------------------------------
  // Render: Result screen
  // -----------------------------------------------------------------------

  if (result) {
    const isAccepted = result.status === 'ACCEPTED'
    const isRejected = result.status === 'REJECTED'

    return (
      <div className="widget-root">
        <div className="result">
          <div className="result-icon">{isAccepted ? '\u2705' : isRejected ? '\u274C' : '\uD83D\uDCC4'}</div>
          <div
            className={`result-status ${isAccepted ? 'accepted' : isRejected ? 'rejected' : 'other'}`}
          >
            {result.status}
          </div>
          <div className="result-doc-label">Documento</div>
          <div className="result-doc-id">{result.documentId}</div>

          {result.cdr && (
            <div className="result-cdr">
              <div className="result-cdr-title">Respuesta CDR</div>
              <div>
                Codigo: <code>{result.cdr.responseCode}</code>
              </div>
              <div>{result.cdr.description}</div>
              {result.cdr.notes && result.cdr.notes.length > 0 && (
                <ul style={{ paddingLeft: '16px', marginTop: '4px' }}>
                  {result.cdr.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {result.error && <div className="alert alert-error">{result.error}</div>}

          {result.sunatHash && (
            <div style={{ fontSize: '11px', color: '#71717a', marginTop: '12px', wordBreak: 'break-all' }}>
              Hash SUNAT: {result.sunatHash}
            </div>
          )}

          <div className="result-actions">
            <button type="button" className="btn btn-primary btn-full" onClick={handleReset}>
              Emitir otro comprobante
            </button>
          </div>
        </div>
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Render: Form
  // -----------------------------------------------------------------------

  return (
    <div className="widget-root">
      <div className="widget-title">Emitir Comprobante</div>
      <div className="widget-subtitle">Complete los datos para emitir el documento electronico</div>

      {/* Document type */}
      <div className="section">
        <div className="section-title">Tipo de Documento</div>
        <div className="grid-2">
          <div className="field">
            <label>Documento</label>
            <select
              value={form.documentType}
              onChange={(e) => updateDocType(e.target.value as '01' | '03')}
            >
              <option value="01">Factura</option>
              <option value="03">Boleta de Venta</option>
            </select>
          </div>
          <div className="field">
            <label>Moneda</label>
            <select
              value={form.currencyCode}
              onChange={(e) => updateField('currencyCode', e.target.value)}
            >
              <option value="PEN">PEN - Soles</option>
              <option value="USD">USD - Dolares</option>
            </select>
          </div>
        </div>
        <div className="grid-3" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>Serie</label>
            <input
              value={form.series}
              maxLength={4}
              onChange={(e) => updateField('series', e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label>Correlativo</label>
            <input
              type="number"
              min={1}
              value={form.correlative}
              onChange={(e) =>
                updateField('correlative', parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
          <div className="field">
            <label>Fecha Emision</label>
            <input
              type="date"
              value={form.issueDate}
              onChange={(e) => updateField('issueDate', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Customer */}
      <div className="section">
        <div className="section-title">Cliente</div>
        <div className="grid-2">
          <div className="field">
            <label>Tipo Doc.</label>
            <select
              value={form.customerDocType}
              onChange={(e) => {
                updateField('customerDocType', e.target.value)
                updateField('customerDocNumber', '')
              }}
            >
              {form.documentType === '01' ? (
                <option value="6">RUC</option>
              ) : (
                <>
                  <option value="1">DNI</option>
                  <option value="6">RUC</option>
                </>
              )}
            </select>
          </div>
          <div className="field">
            <label>
              Numero ({form.customerDocType === '6' ? '11 digitos' : '8 digitos'})
            </label>
            <input
              value={form.customerDocNumber}
              maxLength={form.customerDocType === '6' ? 11 : 8}
              placeholder={form.customerDocType === '6' ? '20123456789' : '12345678'}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '')
                const maxLen = form.customerDocType === '6' ? 11 : 8
                updateField('customerDocNumber', val.slice(0, maxLen))
              }}
            />
          </div>
        </div>
        <div className="grid-2" style={{ marginTop: '12px' }}>
          <div className="field">
            <label>Razon Social / Nombre *</label>
            <input
              value={form.customerName}
              placeholder="Empresa SAC"
              onChange={(e) => updateField('customerName', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Direccion</label>
            <input
              value={form.customerAddress}
              placeholder="Av. Principal 123, Lima"
              onChange={(e) => updateField('customerAddress', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="section">
        <div
          className="section-title"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <span>Items</span>
          <button type="button" className="add-item-btn" onClick={addItem}>
            + Agregar linea
          </button>
        </div>

        {form.items.map((item, idx) => {
          const subtotal = calcLineSubtotal(item.quantity, item.unitPrice, 0)
          const igv = calcLineIGV(subtotal, item.igvType)
          const lineTotal = calcLineTotal(subtotal, igv)

          return (
            <div key={item.id} className="item-row">
              <div className="item-header">
                <span className="item-number">Item {idx + 1}</span>
                {form.items.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeItem(item.id)}
                    title="Eliminar item"
                  >
                    &#x2715;
                  </button>
                )}
              </div>
              <div className="field" style={{ marginBottom: '8px' }}>
                <label>Descripcion *</label>
                <input
                  value={item.description}
                  placeholder="Descripcion del producto o servicio"
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                />
              </div>
              <div className="grid-5">
                <div className="field">
                  <label>Unidad</label>
                  <select
                    value={item.unitCode}
                    onChange={(e) => updateItem(item.id, 'unitCode', e.target.value)}
                  >
                    <option value="NIU">Unidad</option>
                    <option value="ZZ">Servicio</option>
                  </select>
                </div>
                <div className="field">
                  <label>Cant.</label>
                  <input
                    type="number"
                    min={0.01}
                    step="any"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="field">
                  <label>P. Unit.</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="field">
                  <label>IGV</label>
                  <select
                    value={item.igvType}
                    onChange={(e) => updateItem(item.id, 'igvType', e.target.value)}
                  >
                    <option value={IGV_TYPES.GRAVADO}>Gravado</option>
                    <option value={IGV_TYPES.EXONERADO}>Exonerado</option>
                    <option value={IGV_TYPES.INAFECTO}>Inafecto</option>
                  </select>
                </div>
                <div />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '16px',
                  marginTop: '8px',
                  fontSize: '12px',
                }}
              >
                <span style={{ color: '#71717a' }}>
                  Subtotal: {formatCurrency(subtotal, form.currencyCode)}
                </span>
                <span style={{ color: '#71717a' }}>
                  IGV: {formatCurrency(igv, form.currencyCode)}
                </span>
                <span style={{ fontWeight: 600 }}>
                  Total: {formatCurrency(lineTotal, form.currencyCode)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Totals */}
      <div className="totals">
        {totals.totalGravadas > 0 && (
          <div className="total-row">
            <span className="total-label">Op. Gravadas</span>
            <span>{formatCurrency(totals.totalGravadas, form.currencyCode)}</span>
          </div>
        )}
        {totals.totalExoneradas > 0 && (
          <div className="total-row">
            <span className="total-label">Op. Exoneradas</span>
            <span>{formatCurrency(totals.totalExoneradas, form.currencyCode)}</span>
          </div>
        )}
        {totals.totalInafectas > 0 && (
          <div className="total-row">
            <span className="total-label">Op. Inafectas</span>
            <span>{formatCurrency(totals.totalInafectas, form.currencyCode)}</span>
          </div>
        )}
        <div className="total-row">
          <span className="total-label">IGV (18%)</span>
          <span>{formatCurrency(totals.totalIGV, form.currencyCode)}</span>
        </div>
        <div className="total-row grand">
          <span className="total-label">TOTAL</span>
          <span>{formatCurrency(totals.totalAmount, form.currencyCode)}</span>
        </div>
      </div>

      {/* Error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Submit */}
      <button
        type="button"
        className="btn btn-primary btn-full"
        disabled={loading}
        onClick={handleSubmit}
      >
        {loading ? (
          <>
            <span className="spinner" />
            Emitiendo a SUNAT...
          </>
        ) : (
          'Emitir Comprobante'
        )}
      </button>
    </div>
  )
}
