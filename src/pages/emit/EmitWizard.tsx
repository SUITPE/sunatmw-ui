import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, XCircle, AlertTriangle, Plus, Trash2, Loader2, FileText, RotateCcw, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { EmitInvoiceInput, EmitResult } from '@/api/invoices'
import { searchClients } from '@/api/clients'
import { searchProducts } from '@/api/products'
import type { Client, Product } from '@/types'
import { useAutocomplete } from '@/hooks/useAutocomplete'
import {
  calcLineSubtotal,
  calcLineIGV,
  calcLineTotal,
  calcDocumentTotals,
  formatCurrency,
  IGV_TYPES,
} from '@/lib/calculations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EmitWizardConfig {
  documentType: 'factura' | 'boleta'
  title: string
  defaultSeries: string
  seriesPrefix: string // 'F' or 'B'
  defaultCustomerDocType: string // '6' for factura, '1' for boleta
  allowedCustomerDocTypes: Array<{ value: string; label: string }>
  emitFn: (input: EmitInvoiceInput) => Promise<EmitResult>
  emitButtonLabel: string
  emitAnotherLabel: string
}

interface WizardItem {
  id: string
  code: string
  description: string
  quantity: number
  unitCode: string
  unitPrice: number
  igvType: string
  discount: number
}

interface WizardState {
  // Step 1
  series: string
  correlative: number
  issueDate: string
  dueDate: string
  currencyCode: string
  // Step 2
  customerDocType: string
  customerDocNumber: string
  customerName: string
  customerAddress: string
  // Step 3
  items: WizardItem[]
  // Step 4 extras
  observations: string
  purchaseOrder: string
}

const STEPS = [
  { number: 1, label: 'Datos Generales' },
  { number: 2, label: 'Cliente' },
  { number: 3, label: 'Items' },
  { number: 4, label: 'Confirmar' },
] as const

const IGV_TYPE_LABELS: Record<string, string> = {
  [IGV_TYPES.GRAVADO]: 'Gravado',
  [IGV_TYPES.EXONERADO]: 'Exonerado',
  [IGV_TYPES.INAFECTO]: 'Inafecto',
}

const UNIT_CODE_LABELS: Record<string, string> = {
  NIU: 'Unidad (NIU)',
  ZZ: 'Servicio (ZZ)',
}

const DOC_TYPE_LABELS: Record<string, string> = {
  '6': 'RUC',
  '1': 'DNI',
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0] as string
}

function createEmptyItem(): WizardItem {
  return {
    id: crypto.randomUUID(),
    code: '',
    description: '',
    quantity: 1,
    unitCode: 'NIU',
    unitPrice: 0,
    igvType: IGV_TYPES.GRAVADO,
    discount: 0,
  }
}

function createInitialState(config: EmitWizardConfig): WizardState {
  return {
    series: config.defaultSeries,
    correlative: 1,
    issueDate: todayISO(),
    dueDate: '',
    currencyCode: 'PEN',
    customerDocType: config.defaultCustomerDocType,
    customerDocNumber: '',
    customerName: '',
    customerAddress: '',
    items: [createEmptyItem()],
    observations: '',
    purchaseOrder: '',
  }
}

// ---------------------------------------------------------------------------
// Select styling (native HTML styled like shadcn inputs)
// ---------------------------------------------------------------------------

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

// ---------------------------------------------------------------------------
// Autocomplete: Client search
// ---------------------------------------------------------------------------

interface ClientAutocompleteProps {
  onSelectClient: (client: Client) => void
}

function ClientAutocomplete({ onSelectClient }: ClientAutocompleteProps) {
  const ac = useAutocomplete<Client>({ searchFn: searchClients })

  ac.onSelect.current = onSelectClient

  return (
    <div ref={ac.containerRef} className="relative">
      <Label className="text-sm font-medium">Buscar cliente registrado</Label>
      <div className="relative mt-1.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={ac.query}
          onChange={(e) => ac.setQuery(e.target.value)}
          onKeyDown={ac.handleKeyDown}
          placeholder="Buscar por nombre, RUC o DNI..."
          className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {ac.isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {ac.isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {ac.results.length === 0 && !ac.isLoading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {ac.results.map((client, idx) => (
                <li
                  key={client.id}
                  className={`cursor-pointer px-3 py-2 text-sm hover:bg-accent ${
                    idx === ac.activeIndex ? 'bg-accent' : ''
                  }`}
                  onMouseDown={() => ac.selectItem(client)}
                >
                  <div className="font-medium">{client.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {client.documentType === '6' ? 'RUC' : 'DNI'}: {client.documentNumber}
                    {client.address ? ` - ${client.address}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Autocomplete: Product search (per item row)
// ---------------------------------------------------------------------------

interface ProductAutocompleteProps {
  onSelectProduct: (product: Product) => void
}

function ProductAutocomplete({ onSelectProduct }: ProductAutocompleteProps) {
  const ac = useAutocomplete<Product>({ searchFn: searchProducts })

  ac.onSelect.current = onSelectProduct

  return (
    <div ref={ac.containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={ac.query}
          onChange={(e) => ac.setQuery(e.target.value)}
          onKeyDown={ac.handleKeyDown}
          placeholder="Buscar producto del catalogo..."
          className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {ac.isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      {ac.isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          {ac.results.length === 0 && !ac.isLoading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              No se encontraron resultados
            </div>
          ) : (
            <ul className="max-h-48 overflow-auto py-1">
              {ac.results.map((product, idx) => (
                <li
                  key={product.id}
                  className={`cursor-pointer px-3 py-2 text-xs hover:bg-accent ${
                    idx === ac.activeIndex ? 'bg-accent' : ''
                  }`}
                  onMouseDown={() => ac.selectItem(product)}
                >
                  <div className="font-medium">{product.name}</div>
                  <div className="text-muted-foreground">
                    {product.code ? `${product.code} - ` : ''}S/ {parseFloat(product.unitPrice).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateStep1(s: WizardState): string | null {
  if (!s.series.trim()) return 'La serie es obligatoria'
  if (s.correlative < 1) return 'El correlativo debe ser mayor a 0'
  if (!s.issueDate) return 'La fecha de emision es obligatoria'
  return null
}

function validateStep2(s: WizardState): string | null {
  if (!s.customerDocNumber.trim()) return 'El numero de documento del cliente es obligatorio'
  if (s.customerDocType === '6' && s.customerDocNumber.length !== 11)
    return 'El RUC debe tener 11 digitos'
  if (s.customerDocType === '1' && s.customerDocNumber.length !== 8)
    return 'El DNI debe tener 8 digitos'
  if (!/^\d+$/.test(s.customerDocNumber)) return 'El numero de documento solo debe contener digitos'
  if (!s.customerName.trim()) return 'La razon social / nombre del cliente es obligatoria'
  return null
}

function validateStep3(s: WizardState): string | null {
  if (s.items.length === 0) return 'Debe agregar al menos un item'
  for (let i = 0; i < s.items.length; i++) {
    const item = s.items[i]!
    if (!item.description.trim()) return `Item ${i + 1}: la descripcion es obligatoria`
    if (item.quantity <= 0) return `Item ${i + 1}: la cantidad debe ser mayor a 0`
    if (item.unitPrice <= 0) return `Item ${i + 1}: el precio unitario debe ser mayor a 0`
    if (item.discount < 0) return `Item ${i + 1}: el descuento no puede ser negativo`
  }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface EmitWizardProps {
  config: EmitWizardConfig
}

export default function EmitWizard({ config }: EmitWizardProps) {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<WizardState>(() => createInitialState(config))
  const [stepError, setStepError] = useState<string | null>(null)
  const [emitResult, setEmitResult] = useState<EmitResult | null>(null)

  // Mutation
  const mutation = useMutation({
    mutationFn: config.emitFn,
    onSuccess: (data) => setEmitResult(data),
  })

  // Derived totals for items
  const totals = useMemo(() => calcDocumentTotals(form.items), [form.items])

  // ---------------------------------------------------------------------------
  // Form updaters
  // ---------------------------------------------------------------------------

  function updateField<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setStepError(null)
  }

  function updateItem(id: string, field: keyof WizardItem, value: string | number) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }))
    setStepError(null)
  }

  function addItem() {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }))
  }

  function removeItem(id: string) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }))
  }

  // ---------------------------------------------------------------------------
  // Autocomplete handlers
  // ---------------------------------------------------------------------------

  const handleSelectClient = useCallback(
    (client: Client) => {
      setForm((prev) => ({
        ...prev,
        customerDocType: client.documentType,
        customerDocNumber: client.documentNumber,
        customerName: client.name,
        customerAddress: client.address ?? '',
      }))
      setStepError(null)
    },
    [],
  )

  const handleSelectProduct = useCallback(
    (itemId: string, product: Product) => {
      setForm((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                code: product.code ?? '',
                description: product.name,
                unitPrice: parseFloat(product.unitPrice) || 0,
                unitCode: product.unitOfMeasure,
                igvType: product.igvType,
              }
            : item,
        ),
      }))
      setStepError(null)
    },
    [],
  )

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  function goNext() {
    let error: string | null = null
    if (step === 1) error = validateStep1(form)
    else if (step === 2) error = validateStep2(form)
    else if (step === 3) error = validateStep3(form)

    if (error) {
      setStepError(error)
      return
    }
    setStepError(null)
    setStep((s) => Math.min(s + 1, 4))
  }

  function goBack() {
    setStepError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  function handleEmit() {
    // Auto-generate item codes if empty
    const itemsWithCodes = form.items.map((item, idx) => ({
      code: item.code.trim() || `ITEM-${String(idx + 1).padStart(3, '0')}`,
      description: item.description,
      quantity: item.quantity,
      unitCode: item.unitCode,
      unitPrice: item.unitPrice,
      igvType: item.igvType,
      ...(item.discount > 0 ? { discount: item.discount } : {}),
    }))

    const payload: EmitInvoiceInput = {
      series: form.series.trim(),
      correlative: form.correlative,
      issueDate: form.issueDate,
      ...(form.dueDate ? { dueDate: form.dueDate } : {}),
      currencyCode: form.currencyCode,
      customer: {
        identityType: form.customerDocType,
        identityNumber: form.customerDocNumber.trim(),
        name: form.customerName.trim(),
        ...(form.customerAddress.trim() ? { address: form.customerAddress.trim() } : {}),
      },
      items: itemsWithCodes,
      ...(form.observations.trim() ? { observations: form.observations.trim() } : {}),
      ...(form.purchaseOrder.trim() ? { purchaseOrder: form.purchaseOrder.trim() } : {}),
    }

    mutation.mutate(payload)
  }

  function handleReset() {
    setForm(createInitialState(config))
    setStep(1)
    setStepError(null)
    setEmitResult(null)
    mutation.reset()
  }

  // ---------------------------------------------------------------------------
  // Render: Step indicator
  // ---------------------------------------------------------------------------

  function renderStepIndicator() {
    return (
      <div className="flex items-center justify-center gap-1 mb-6">
        {STEPS.map((s, idx) => {
          const isActive = step === s.number
          const isCompleted = step > s.number
          return (
            <div key={s.number} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                </div>
                <span
                  className={`text-sm hidden sm:inline ${
                    isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`w-8 sm:w-12 h-px mx-2 ${
                    step > s.number ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 1 - Datos Generales
  // ---------------------------------------------------------------------------

  function renderStep1() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos Generales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series">Serie *</Label>
              <Input
                id="series"
                value={form.series}
                onChange={(e) => updateField('series', e.target.value.toUpperCase())}
                placeholder={config.defaultSeries}
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correlative">Correlativo *</Label>
              <Input
                id="correlative"
                type="number"
                min={1}
                value={form.correlative}
                onChange={(e) => updateField('correlative', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">Fecha de Emision *</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => updateField('issueDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencyCode">Moneda *</Label>
            <select
              id="currencyCode"
              className={selectClassName}
              value={form.currencyCode}
              onChange={(e) => updateField('currencyCode', e.target.value)}
            >
              <option value="PEN">PEN - Soles</option>
              <option value="USD">USD - Dolares</option>
            </select>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 2 - Cliente
  // ---------------------------------------------------------------------------

  function renderStep2() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Client autocomplete search */}
          <ClientAutocomplete onSelectClient={handleSelectClient} />

          {/* Divider */}
          <div className="relative py-2">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              o completar manualmente
            </span>
          </div>

          {/* Manual entry fields (unchanged) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerDocType">Tipo de Documento *</Label>
              <select
                id="customerDocType"
                className={selectClassName}
                value={form.customerDocType}
                onChange={(e) => {
                  updateField('customerDocType', e.target.value)
                  updateField('customerDocNumber', '')
                }}
              >
                {config.allowedCustomerDocTypes.map((docType) => (
                  <option key={docType.value} value={docType.value}>
                    {docType.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerDocNumber">
                Numero de Documento * ({form.customerDocType === '6' ? '11 digitos' : '8 digitos'})
              </Label>
              <Input
                id="customerDocNumber"
                value={form.customerDocNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '')
                  const maxLen = form.customerDocType === '6' ? 11 : 8
                  updateField('customerDocNumber', val.slice(0, maxLen))
                }}
                placeholder={form.customerDocType === '6' ? '20123456789' : '12345678'}
                maxLength={form.customerDocType === '6' ? 11 : 8}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Razon Social / Nombre *</Label>
            <Input
              id="customerName"
              value={form.customerName}
              onChange={(e) => updateField('customerName', e.target.value)}
              placeholder="Empresa SAC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerAddress">Direccion</Label>
            <Input
              id="customerAddress"
              value={form.customerAddress}
              onChange={(e) => updateField('customerAddress', e.target.value)}
              placeholder="Av. Principal 123, Lima"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 3 - Items
  // ---------------------------------------------------------------------------

  function renderStep3() {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle de Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar linea
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Desktop table header */}
          <div className="hidden lg:grid lg:grid-cols-[60px_1fr_80px_110px_90px_110px_80px_100px_100px_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
            <span>Codigo</span>
            <span>Descripcion</span>
            <span>Cant.</span>
            <span>Unidad</span>
            <span>P. Unit.</span>
            <span>Tipo IGV</span>
            <span>Desc.</span>
            <span className="text-right">Subtotal</span>
            <span className="text-right">IGV</span>
            <span />
          </div>

          {form.items.map((item, idx) => {
            const subtotal = calcLineSubtotal(item.quantity, item.unitPrice, item.discount)
            const igv = calcLineIGV(subtotal, item.igvType)

            return (
              <div key={item.id}>
                {/* Mobile: stacked layout */}
                <div className="lg:hidden space-y-3 p-3 rounded-md border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Item {idx + 1}</span>
                    {form.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {/* Product autocomplete for mobile */}
                  <ProductAutocomplete
                    onSelectProduct={(product) => handleSelectProduct(item.id, product)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Codigo</Label>
                      <Input
                        value={item.code}
                        onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                        placeholder={`ITEM-${String(idx + 1).padStart(3, '0')}`}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Unidad</Label>
                      <select
                        className={`${selectClassName} h-9`}
                        value={item.unitCode}
                        onChange={(e) => updateItem(item.id, 'unitCode', e.target.value)}
                      >
                        <option value="NIU">Unidad</option>
                        <option value="ZZ">Servicio</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descripcion *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Descripcion del producto o servicio"
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad</Label>
                      <Input
                        type="number"
                        min={0.01}
                        step="any"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">P. Unit.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Desc.</Label>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={item.discount}
                        onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tipo IGV</Label>
                    <select
                      className={`${selectClassName} h-9`}
                      value={item.igvType}
                      onChange={(e) => updateItem(item.id, 'igvType', e.target.value)}
                    >
                      <option value={IGV_TYPES.GRAVADO}>Gravado</option>
                      <option value={IGV_TYPES.EXONERADO}>Exonerado</option>
                      <option value={IGV_TYPES.INAFECTO}>Inafecto</option>
                    </select>
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <span className="text-muted-foreground">
                      Subtotal: {formatCurrency(subtotal, form.currencyCode)}
                    </span>
                    <span className="text-muted-foreground">
                      IGV: {formatCurrency(igv, form.currencyCode)}
                    </span>
                    <span className="font-medium">
                      Total: {formatCurrency(calcLineTotal(subtotal, igv), form.currencyCode)}
                    </span>
                  </div>
                </div>

                {/* Desktop: product search + row layout */}
                <div className="hidden lg:block space-y-2">
                  <div className="max-w-sm">
                    <ProductAutocomplete
                      onSelectProduct={(product) => handleSelectProduct(item.id, product)}
                    />
                  </div>
                  <div className="grid grid-cols-[60px_1fr_80px_110px_90px_110px_80px_100px_100px_40px] gap-2 items-center">
                    <Input
                      value={item.code}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      placeholder={`ITEM-${String(idx + 1).padStart(3, '0')}`}
                      className="h-9 text-xs"
                    />
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Descripcion"
                      className="h-9 text-xs"
                    />
                    <Input
                      type="number"
                      min={0.01}
                      step="any"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs"
                    />
                    <select
                      className={`${selectClassName} h-9 text-xs`}
                      value={item.unitCode}
                      onChange={(e) => updateItem(item.id, 'unitCode', e.target.value)}
                    >
                      <option value="NIU">Unidad</option>
                      <option value="ZZ">Servicio</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs"
                    />
                    <select
                      className={`${selectClassName} h-9 text-xs`}
                      value={item.igvType}
                      onChange={(e) => updateItem(item.id, 'igvType', e.target.value)}
                    >
                      <option value={IGV_TYPES.GRAVADO}>Gravado</option>
                      <option value={IGV_TYPES.EXONERADO}>Exonerado</option>
                      <option value={IGV_TYPES.INAFECTO}>Inafecto</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={item.discount}
                      onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      className="h-9 text-xs"
                    />
                    <span className="text-right text-xs font-medium">
                      {formatCurrency(subtotal, form.currencyCode)}
                    </span>
                    <span className="text-right text-xs font-medium">
                      {formatCurrency(igv, form.currencyCode)}
                    </span>
                    <div className="flex justify-center">
                      {form.items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          <Separator />

          {/* Totals summary */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              {totals.totalGravadas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Gravadas</span>
                  <span>{formatCurrency(totals.totalGravadas, form.currencyCode)}</span>
                </div>
              )}
              {totals.totalExoneradas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Exoneradas</span>
                  <span>{formatCurrency(totals.totalExoneradas, form.currencyCode)}</span>
                </div>
              )}
              {totals.totalInafectas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Inafectas</span>
                  <span>{formatCurrency(totals.totalInafectas, form.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span>{formatCurrency(totals.totalIGV, form.currencyCode)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>{formatCurrency(totals.totalAmount, form.currencyCode)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Step 4 - Confirmar
  // ---------------------------------------------------------------------------

  function renderStep4() {
    // If we already have a result, show it
    if (emitResult) {
      return renderResult()
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmar y Emitir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Datos generales summary */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Datos Generales
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Serie:</span>
                <p className="font-medium">{form.series}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Correlativo:</span>
                <p className="font-medium">{form.correlative}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Fecha emision:</span>
                <p className="font-medium">{form.issueDate}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Moneda:</span>
                <p className="font-medium">{form.currencyCode}</p>
              </div>
              {form.dueDate && (
                <div>
                  <span className="text-muted-foreground">Fecha vencimiento:</span>
                  <p className="font-medium">{form.dueDate}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Cliente summary */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Tipo documento:</span>
                <p className="font-medium">{DOC_TYPE_LABELS[form.customerDocType] ?? form.customerDocType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Numero:</span>
                <p className="font-medium font-mono">{form.customerDocNumber}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Razon social:</span>
                <p className="font-medium">{form.customerName}</p>
              </div>
              {form.customerAddress && (
                <div>
                  <span className="text-muted-foreground">Direccion:</span>
                  <p className="font-medium">{form.customerAddress}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Items summary */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Items ({form.items.length})
            </h3>
            <div className="space-y-2">
              {form.items.map((item, idx) => {
                const subtotal = calcLineSubtotal(item.quantity, item.unitPrice, item.discount)
                const igv = calcLineIGV(subtotal, item.igvType)
                const lineTotal = calcLineTotal(subtotal, igv)
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                  >
                    <div className="flex-1">
                      <span className="font-medium">{idx + 1}. {item.description}</span>
                      <span className="text-muted-foreground ml-2">
                        {item.quantity} x {formatCurrency(item.unitPrice, form.currencyCode)}
                        {' '}({UNIT_CODE_LABELS[item.unitCode] ?? item.unitCode})
                        {' '}- {IGV_TYPE_LABELS[item.igvType] ?? item.igvType}
                      </span>
                    </div>
                    <span className="font-medium">{formatCurrency(lineTotal, form.currencyCode)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-72 space-y-2 text-sm">
              {totals.totalGravadas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Gravadas</span>
                  <span>{formatCurrency(totals.totalGravadas, form.currencyCode)}</span>
                </div>
              )}
              {totals.totalExoneradas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Exoneradas</span>
                  <span>{formatCurrency(totals.totalExoneradas, form.currencyCode)}</span>
                </div>
              )}
              {totals.totalInafectas > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Op. Inafectas</span>
                  <span>{formatCurrency(totals.totalInafectas, form.currencyCode)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGV (18%)</span>
                <span>{formatCurrency(totals.totalIGV, form.currencyCode)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>TOTAL</span>
                <span>{formatCurrency(totals.totalAmount, form.currencyCode)}</span>
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="observations">Observaciones</Label>
              <Input
                id="observations"
                value={form.observations}
                onChange={(e) => updateField('observations', e.target.value)}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseOrder">Orden de Compra</Label>
              <Input
                id="purchaseOrder"
                value={form.purchaseOrder}
                onChange={(e) => updateField('purchaseOrder', e.target.value)}
                placeholder="Numero de orden de compra (opcional)"
              />
            </div>
          </div>

          {/* Mutation error */}
          {mutation.isError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error al emitir</AlertTitle>
              <AlertDescription>{mutation.error.message}</AlertDescription>
            </Alert>
          )}

          {/* Submit button */}
          <div className="flex justify-end">
            <Button
              onClick={handleEmit}
              disabled={mutation.isPending}
              size="lg"
              className="min-w-[200px]"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Emitiendo a SUNAT...
                </>
              ) : (
                config.emitButtonLabel
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: Result
  // ---------------------------------------------------------------------------

  function renderResult() {
    if (!emitResult) return null

    const isAccepted = emitResult.status === 'ACCEPTED'
    const isRejected = emitResult.status === 'REJECTED'
    const isObservation =
      emitResult.cdr?.responseCode !== undefined &&
      emitResult.cdr.responseCode !== '0' &&
      !isRejected

    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultado de Emision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status badge */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {isAccepted && (
              <>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">
                  ACEPTADO
                </Badge>
              </>
            )}
            {isRejected && (
              <>
                <div className="rounded-full bg-red-100 p-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <Badge variant="destructive" className="text-sm px-3 py-1">
                  RECHAZADO
                </Badge>
              </>
            )}
            {isObservation && (
              <>
                <div className="rounded-full bg-amber-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-sm px-3 py-1">
                  CON OBSERVACIONES
                </Badge>
              </>
            )}
            {!isAccepted && !isRejected && !isObservation && (
              <>
                <div className="rounded-full bg-blue-100 p-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <Badge className="text-sm px-3 py-1">
                  {emitResult.status}
                </Badge>
              </>
            )}
          </div>

          {/* Document ID */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Documento</p>
            <p className="text-lg font-mono font-bold">{emitResult.documentId}</p>
          </div>

          {/* CDR details */}
          {emitResult.cdr && (
            <div className="rounded-md border p-4 space-y-2">
              <h4 className="text-sm font-semibold">Respuesta CDR</h4>
              <div className="text-sm">
                <span className="text-muted-foreground">Codigo: </span>
                <span className="font-mono">{emitResult.cdr.responseCode}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Descripcion: </span>
                <span>{emitResult.cdr.description}</span>
              </div>
              {emitResult.cdr.notes && emitResult.cdr.notes.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas:</span>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {emitResult.cdr.notes.map((note, i) => (
                      <li key={i} className="text-muted-foreground">{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {emitResult.error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{emitResult.error}</AlertDescription>
            </Alert>
          )}

          {/* Hash */}
          {emitResult.sunatHash && (
            <div className="text-sm">
              <span className="text-muted-foreground">Hash SUNAT: </span>
              <span className="font-mono text-xs break-all">{emitResult.sunatHash}</span>
            </div>
          )}

          <Separator />

          {/* Post-emission actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(`/documents/${emitResult.id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Ver documento
            </Button>
            <Button onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              {config.emitAnotherLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{config.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Complete los datos del comprobante electronico
        </p>
      </div>

      {renderStepIndicator()}

      {stepError && (
        <Alert variant="destructive" className="mb-4">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{stepError}</AlertDescription>
        </Alert>
      )}

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      {/* Navigation buttons (hidden on step 4 when result is shown) */}
      {!(step === 4 && emitResult) && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={step === 1}
          >
            Anterior
          </Button>
          {step < 4 && (
            <Button onClick={goNext}>
              Siguiente
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
