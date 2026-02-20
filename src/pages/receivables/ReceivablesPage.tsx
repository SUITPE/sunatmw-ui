import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Banknote, DollarSign, AlertTriangle, Clock, CheckCircle, X,
  ChevronLeft, ChevronRight, CreditCard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getReceivables,
  getReceivableSummary,
  getAgingReport,
  registerPayment,
} from '@/api/receivables'
import type { Receivable, RegisterPaymentInput } from '@/api/receivables'

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  paid: 'Pagado',
  overdue: 'Vencido',
  written_off: 'Castigado',
}

const PAYMENT_METHODS: Record<string, string> = {
  transfer: 'Transferencia',
  cash: 'Efectivo',
  check: 'Cheque',
  card: 'Tarjeta',
  other: 'Otro',
}

const AGING_LABELS: Record<string, string> = {
  current: 'Corriente',
  days1to30: '1 - 30 dias',
  days31to60: '31 - 60 dias',
  days61to90: '61 - 90 dias',
  days90plus: '90+ dias',
}

function formatCurrency(value: string | number, currency = 'PEN'): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return `${currency} 0.00`
  return `${currency} ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] || status
  const styles: Record<string, string> = {
    paid: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
    partial: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
    overdue: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    written_off: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
  }
  return <Badge className={styles[status] || styles.pending}>{label}</Badge>
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function ReceivablesPage() {
  const queryClient = useQueryClient()

  const [payingReceivable, setPayingReceivable] = useState<Receivable | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Reset page when filters change
  useEffect(() => { setPage(1) }, [statusFilter, fromDate, toDate])

  // Queries
  const { data: receivablesData, isLoading: loadingReceivables } = useQuery({
    queryKey: ['receivables', { page, limit, status: statusFilter, from: fromDate, to: toDate }],
    queryFn: () => getReceivables({
      page,
      limit,
      status: statusFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
  })

  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['receivables-summary'],
    queryFn: getReceivableSummary,
  })

  const { data: aging, isLoading: loadingAging } = useQuery({
    queryKey: ['receivables-aging'],
    queryFn: getAgingReport,
  })

  const receivables = receivablesData?.data ?? []
  const totalPages = receivablesData?.totalPages ?? 0
  const total = receivablesData?.total ?? 0

  // Compute "por vencer" (due within next 7 days)
  const dueSoonCount = receivables.filter((r) => {
    if (r.status === 'paid' || r.status === 'written_off') return false
    const dueDate = new Date(r.dueDate)
    const now = new Date()
    const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays <= 7
  }).length

  // Mutations
  const paymentMutation = useMutation({
    mutationFn: ({ receivableId, input }: { receivableId: string; input: RegisterPaymentInput }) =>
      registerPayment(receivableId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] })
      queryClient.invalidateQueries({ queryKey: ['receivables-summary'] })
      queryClient.invalidateQueries({ queryKey: ['receivables-aging'] })
      setPayingReceivable(null)
      setToast('Pago registrado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    if (page < totalPages) {
      setPage((p) => p + 1)
    }
  }, [totalPages, page])

  // Calculate aging total for percentage bar
  const agingTotal = aging
    ? Object.values(aging.buckets).reduce((sum, val) => sum + val, 0)
    : 0

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cobranza</h1>
          <p className="text-muted-foreground text-sm mt-1">Dashboard de cuentas por cobrar y aging report</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingSummary ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pendiente</p>
                    <p className="text-2xl font-bold">{formatCurrency(summary?.totalPending ?? '0')}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Por Vencer (7 dias)</p>
                    <p className="text-2xl font-bold">{dueSoonCount} facturas</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Vencido</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.totalOverdue ?? '0')}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cobrado este Mes</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary?.totalPaidThisMonth ?? '0')}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={selectClassName}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="partial">Parcial</option>
            <option value="paid">Pagado</option>
            <option value="overdue">Vencido</option>
            <option value="written_off">Castigado</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-40"
            placeholder="Desde"
          />
          <span className="text-muted-foreground text-sm">a</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-40"
            placeholder="Hasta"
          />
        </div>
        {(statusFilter || fromDate || toDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter(''); setFromDate(''); setToDate('') }}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" /> Limpiar filtros
          </Button>
        )}
      </div>

      {/* Receivables Table */}
      {loadingReceivables ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)}
          </CardContent>
        </Card>
      ) : receivables.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Banknote className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No hay cuentas por cobrar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {statusFilter || fromDate || toDate
              ? 'No se encontraron resultados con los filtros aplicados'
              : 'Las cuentas por cobrar se crean automaticamente al emitir facturas'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="w-[100px]">Emision</TableHead>
                    <TableHead className="w-[100px]">Vencimiento</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivables.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-mono text-sm">{rec.invoiceNumber}</TableCell>
                      <TableCell className="font-medium">{rec.client?.name ?? '-'}</TableCell>
                      <TableCell className="text-sm">{formatDate(rec.issueDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(rec.dueDate)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(rec.totalAmount, rec.currency)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(rec.paidAmount, rec.currency)}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(rec.balanceAmount, rec.currency)}</TableCell>
                      <TableCell><StatusBadge status={rec.status} /></TableCell>
                      <TableCell className="text-right">
                        {rec.status !== 'paid' && rec.status !== 'written_off' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Registrar pago"
                            onClick={() => { setPayingReceivable(rec); setFormError(null) }}
                          >
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {receivables.map((rec) => (
              <Card key={rec.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-mono text-sm font-medium">{rec.invoiceNumber}</span>
                      <p className="text-sm text-muted-foreground">{rec.client?.name ?? '-'}</p>
                    </div>
                    <StatusBadge status={rec.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Total</span>
                      <p className="font-medium">{formatCurrency(rec.totalAmount, rec.currency)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pagado</span>
                      <p>{formatCurrency(rec.paidAmount, rec.currency)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saldo</span>
                      <p className="font-medium">{formatCurrency(rec.balanceAmount, rec.currency)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Vence: {formatDate(rec.dueDate)}</span>
                    {rec.status !== 'paid' && rec.status !== 'written_off' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setPayingReceivable(rec); setFormError(null) }}
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Pagar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages} ({total} cuentas)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Aging Report */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reporte de Antiguedad (Aging Report)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAging ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 my-1" />)
            ) : aging ? (
              <>
                {/* Aging Bar Visual */}
                {agingTotal > 0 && (
                  <div className="mb-6">
                    <div className="flex h-6 rounded-md overflow-hidden">
                      {Object.entries(aging.buckets).map(([key, val]) => {
                        if (val === 0) return null
                        const pct = (val / agingTotal) * 100
                        const colors: Record<string, string> = {
                          current: 'bg-green-500',
                          days1to30: 'bg-yellow-500',
                          days31to60: 'bg-orange-500',
                          days61to90: 'bg-red-400',
                          days90plus: 'bg-red-600',
                        }
                        return (
                          <div
                            key={key}
                            className={`${colors[key]} flex items-center justify-center text-xs text-white font-medium`}
                            style={{ width: `${pct}%` }}
                            title={`${AGING_LABELS[key]}: ${formatCurrency(val)}`}
                          >
                            {pct >= 10 ? `${pct.toFixed(0)}%` : ''}
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {Object.entries(AGING_LABELS).map(([key, label]) => {
                        const colors: Record<string, string> = {
                          current: 'bg-green-500',
                          days1to30: 'bg-yellow-500',
                          days31to60: 'bg-orange-500',
                          days61to90: 'bg-red-400',
                          days90plus: 'bg-red-600',
                        }
                        return (
                          <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className={`w-3 h-3 rounded-sm ${colors[key]}`} />
                            <span>{label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Aging Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rango</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right"># Facturas</TableHead>
                      <TableHead className="text-right">% del Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(AGING_LABELS).map(([key, label]) => {
                      const amount = aging.buckets[key] ?? 0
                      const count = aging.counts[key] ?? 0
                      const pct = agingTotal > 0 ? ((amount / agingTotal) * 100).toFixed(1) : '0.0'
                      return (
                        <TableRow key={key}>
                          <TableCell className="font-medium">{label}</TableCell>
                          <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                          <TableCell className="text-right">{pct}%</TableCell>
                        </TableRow>
                      )
                    })}
                    <TableRow className="font-bold border-t-2">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(agingTotal)}</TableCell>
                      <TableCell className="text-right">
                        {aging ? Object.values(aging.counts).reduce((s, v) => s + v, 0) : 0}
                      </TableCell>
                      <TableCell className="text-right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Register Payment Modal */}
      {payingReceivable && (
        <RegisterPaymentModal
          receivable={payingReceivable}
          error={formError}
          isLoading={paymentMutation.isPending}
          onClose={() => { setPayingReceivable(null); setFormError(null) }}
          onSubmit={(input) => paymentMutation.mutate({ receivableId: payingReceivable.id, input })}
        />
      )}
    </div>
  )
}

/* --- Register Payment Modal ---------------------------------------------- */

interface RegisterPaymentModalProps {
  receivable: Receivable
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: RegisterPaymentInput) => void
}

function RegisterPaymentModal({ receivable, error, isLoading, onClose, onSubmit }: RegisterPaymentModalProps) {
  const balance = parseFloat(receivable.balanceAmount)
  const [amount, setAmount] = useState(balance.toString())
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('transfer')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setValidationError('Ingrese un monto valido mayor a 0')
      return
    }
    if (numAmount > balance) {
      setValidationError(`El monto no puede exceder el saldo pendiente (${formatCurrency(balance, receivable.currency)})`)
      return
    }
    if (!paymentDate) {
      setValidationError('La fecha de pago es requerida')
      return
    }

    onSubmit({
      amount: numAmount,
      paymentDate,
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-lg font-semibold">Registrar Pago</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {receivable.invoiceNumber} - {receivable.client?.name ?? 'Sin cliente'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Summary info */}
          <div className="rounded-md bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total factura:</span>
              <span className="font-medium">{formatCurrency(receivable.totalAmount, receivable.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ya pagado:</span>
              <span>{formatCurrency(receivable.paidAmount, receivable.currency)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Saldo pendiente:</span>
              <span>{formatCurrency(receivable.balanceAmount, receivable.currency)}</span>
            </div>
          </div>

          {(validationError || error) && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {validationError || error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="pay-amount">Monto a pagar ({receivable.currency})</Label>
            <Input
              id="pay-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={balance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-date">Fecha de pago</Label>
            <Input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-method">Metodo de pago</Label>
            <select
              id="pay-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(PAYMENT_METHODS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-reference">Referencia bancaria</Label>
            <Input
              id="pay-reference"
              placeholder="Numero de operacion, voucher, etc."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay-notes">Notas</Label>
            <textarea
              id="pay-notes"
              placeholder="Observaciones adicionales"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
