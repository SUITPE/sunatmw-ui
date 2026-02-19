import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronRight, Code, FileCheck, Ban, FileX,
  AlertTriangle, Loader2, ArrowLeft, FileMinus2, FilePlus2, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { VoidDocumentDialog } from '@/components/shared/VoidDocumentDialog'
import { useDocument } from '@/hooks/useDocuments'
import { useAuthStore } from '@/stores/auth.store'
import { downloadDocumentXml, downloadDocumentCdr, checkTicket } from '@/api/documents'
import type { DocumentInput, DocumentItem } from '@/types'

const DOC_TYPE_NAMES: Record<string, string> = {
  '01': 'Factura Electronica',
  '03': 'Boleta de Venta Electronica',
  '07': 'Nota de Credito Electronica',
  '08': 'Nota de Debito Electronica',
  '09': 'Guia de Remision Electronica',
  '20': 'Comprobante de Retencion Electronico',
  '40': 'Comprobante de Percepcion Electronico',
  'RA': 'Comunicacion de Baja',
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  ACCEPTED: 'border-t-green-500',
  REJECTED: 'border-t-red-500',
  PENDING: 'border-t-amber-500',
  SENT: 'border-t-amber-500',
  ERROR: 'border-t-red-500',
  VOIDED: 'border-t-gray-500',
  OBSERVED: 'border-t-amber-500',
}

const IDENTITY_TYPE_NAMES: Record<string, string> = {
  '6': 'RUC',
  '1': 'DNI',
  '4': 'Carnet de Extranjeria',
  '7': 'Pasaporte',
  '0': 'Sin documento',
  '-': 'Varios',
}

const IGV_RATE = 0.18

function computeItemTotals(items: DocumentItem[]) {
  let gravadas = 0
  let exoneradas = 0
  let inafectas = 0
  let totalIgv = 0

  for (const item of items) {
    const subtotal = item.quantity * item.unitPrice
    const discount = item.discount ?? 0
    const base = subtotal - discount

    if (item.igvType === '10') {
      gravadas += base
      totalIgv += base * IGV_RATE
    } else if (item.igvType === '20') {
      exoneradas += base
    } else if (item.igvType === '30') {
      inafectas += base
    } else {
      gravadas += base
      totalIgv += base * IGV_RATE
    }
  }

  const total = gravadas + exoneradas + inafectas + totalIgv
  return { gravadas, exoneradas, inafectas, totalIgv, total }
}

function formatCurrency(amount: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const canVoid = user?.role === 'admin' || user?.role === 'facturador'
  const canEmitNotes = canVoid

  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [isCheckingTicket, setIsCheckingTicket] = useState(false)

  const { data: doc, isLoading, error } = useDocument(id!)

  const input = doc?.jsonInput as DocumentInput | null
  const items = input?.items ?? []
  const totals = computeItemTotals(items)
  const currency = input?.currencyCode ?? 'PEN'

  const handleDownloadXml = async () => {
    if (!doc) return
    const blob = await downloadDocumentXml(doc.id)
    triggerDownload(blob, `${doc.documentId}.xml`)
  }

  const handleDownloadCdr = async () => {
    if (!doc) return
    const blob = await downloadDocumentCdr(doc.id)
    triggerDownload(blob, `R-${doc.documentId}.xml`)
  }

  const handleCheckTicket = async () => {
    if (!doc) return
    setIsCheckingTicket(true)
    try {
      await checkTicket(doc.id)
      queryClient.invalidateQueries({ queryKey: ['document', id] })
    } catch {
      // silently fail — the user can retry
    } finally {
      setIsCheckingTicket(false)
    }
  }

  const handleVoidSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['document', id] })
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-5 w-64 mb-4" />
        <Skeleton className="h-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-64 mb-4" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (error?.message === 'Document not found' || (!isLoading && !doc)) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <FileX className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium">Documento no encontrado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          El documento que buscas no existe o fue eliminado
        </p>
        <Button className="mt-4" onClick={() => navigate('/documents')}>
          Volver a Documentos
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-medium">Error al cargar el documento</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ocurrio un error inesperado. Intenta de nuevo en unos minutos.
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => navigate('/documents')}>Volver</Button>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (!doc) return null

  const borderColor = STATUS_BORDER_COLORS[doc.status] ?? 'border-t-gray-500'

  return (
    <div>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <button
          onClick={() => navigate('/documents')}
          className="text-primary hover:underline"
        >
          Documentos
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-foreground font-medium">{doc.documentId}</span>
      </div>

      {/* Status Header Card */}
      <Card className={`border-t-4 ${borderColor}`}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                {DOC_TYPE_NAMES[doc.type] ?? doc.type}
              </p>
              <p className="text-2xl font-bold font-mono mt-1">{doc.documentId}</p>
              <div className="mt-2">
                <StatusBadge status={doc.status} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadXml}>
                <Code className="h-4 w-4 mr-2" />Descargar XML
              </Button>
              {doc.status === 'ACCEPTED' && (
                <Button variant="outline" size="sm" onClick={handleDownloadCdr}>
                  <FileCheck className="h-4 w-4 mr-2" />Descargar CDR
                </Button>
              )}
              {doc.status === 'ACCEPTED' && canEmitNotes && (doc.type === '01' || doc.type === '03') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                    onClick={() => navigate(`/emit-credit-note?ref=${doc.documentId}&type=${doc.type}`)}
                  >
                    <FileMinus2 className="h-4 w-4 mr-2" />Emitir NC
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    onClick={() => navigate(`/emit-debit-note?ref=${doc.documentId}&type=${doc.type}`)}
                  >
                    <FilePlus2 className="h-4 w-4 mr-2" />Emitir ND
                  </Button>
                </>
              )}
              {doc.status === 'ACCEPTED' && canVoid && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => setVoidDialogOpen(true)}
                >
                  <Ban className="h-4 w-4 mr-2" />Anular
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emisor + Receptor */}
      {input && (
        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Datos del Emisor</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-sm text-muted-foreground">RUC</dt>
                <dd className="text-sm font-medium">{user?.tenant.ruc ?? '-'}</dd>
                <dt className="text-sm text-muted-foreground">Razon Social</dt>
                <dd className="text-sm font-medium">{user?.tenant.name ?? '-'}</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Datos del Receptor</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                <dt className="text-sm text-muted-foreground">Tipo Doc.</dt>
                <dd className="text-sm font-medium">
                  {IDENTITY_TYPE_NAMES[input.customer.identityType] ?? input.customer.identityType}
                </dd>
                <dt className="text-sm text-muted-foreground">Numero</dt>
                <dd className="text-sm font-medium font-mono">{input.customer.identityNumber}</dd>
                <dt className="text-sm text-muted-foreground">Razon Social</dt>
                <dd className="text-sm font-medium">{input.customer.name}</dd>
                {input.customer.address && (
                  <>
                    <dt className="text-sm text-muted-foreground">Direccion</dt>
                    <dd className="text-sm font-medium">{input.customer.address}</dd>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Datos Generales */}
      {input && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Datos Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha de Emision</p>
                <p className="text-sm font-medium mt-1">{formatDate(input.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Moneda</p>
                <p className="text-sm font-medium mt-1">
                  {currency === 'PEN' ? 'PEN - Soles' : currency === 'USD' ? 'USD - Dolares' : currency}
                </p>
              </div>
              {input.dueDate && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Fecha Vencimiento</p>
                  <p className="text-sm font-medium mt-1">{formatDate(input.dueDate)}</p>
                </div>
              )}
              {input.referenceDocumentId && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Documento de Referencia</p>
                  <p className="text-sm font-medium mt-1 font-mono">{input.referenceDocumentId}</p>
                </div>
              )}
              {input.responseDescription && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Motivo</p>
                  <p className="text-sm font-medium mt-1">{input.responseDescription}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Items <span className="text-muted-foreground font-normal">({items.length} items)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">#</TableHead>
                    <TableHead className="w-[60px] text-center">Cant.</TableHead>
                    <TableHead className="w-[50px] text-center">Und.</TableHead>
                    <TableHead>Descripcion</TableHead>
                    <TableHead className="w-[100px] text-right">V. Unitario</TableHead>
                    <TableHead className="w-[80px] text-right">IGV</TableHead>
                    <TableHead className="w-[110px] text-right">Importe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, i) => {
                    const base = item.quantity * item.unitPrice - (item.discount ?? 0)
                    const igv = item.igvType === '10' ? base * IGV_RATE : 0
                    const importe = base + igv
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-sm text-muted-foreground text-center">{i + 1}</TableCell>
                        <TableCell className="text-sm text-center">{item.quantity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground text-center">{item.unitCode}</TableCell>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(item.unitPrice, currency)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{formatCurrency(igv, currency)}</TableCell>
                        <TableCell className="text-sm text-right font-medium font-mono">{formatCurrency(importe, currency)}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="font-semibold bg-muted/30">
                    <TableCell colSpan={4} className="text-right">Total</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.gravadas + totals.exoneradas + totals.inafectas, currency)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.totalIgv, currency)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(totals.total, currency)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {items.map((item, i) => {
                const base = item.quantity * item.unitPrice - (item.discount ?? 0)
                const igv = item.igvType === '10' ? base * IGV_RATE : 0
                const importe = base + igv
                return (
                  <div key={i} className="border rounded-md p-3">
                    <p className="text-sm font-medium">{i + 1}. {item.description}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.quantity} x {formatCurrency(item.unitPrice, currency)} ({item.unitCode})
                    </p>
                    {igv > 0 && (
                      <p className="text-sm text-muted-foreground">
                        IGV: {formatCurrency(igv, currency)}
                      </p>
                    )}
                    <p className="text-sm font-medium mt-1">
                      Total: {formatCurrency(importe, currency)}
                    </p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totales + Resumen SUNAT */}
      <div className="grid md:grid-cols-2 gap-4 mt-4">
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Op. Gravadas</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(totals.gravadas, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Op. Exoneradas</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(totals.exoneradas, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">Op. Inafectas</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(totals.inafectas, currency)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-sm text-muted-foreground">IGV (18%)</span>
                  <span className="text-sm font-medium font-mono">{formatCurrency(totals.totalIgv, currency)}</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between py-1">
                  <span className="text-lg font-bold">TOTAL</span>
                  <span className="text-lg font-bold font-mono">{formatCurrency(totals.total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Respuesta SUNAT</CardTitle>
          </CardHeader>
          <CardContent>
            {doc.cdrResponseCode !== null ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Codigo CDR</p>
                  <p className="font-mono text-sm mt-1">{doc.cdrResponseCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Descripcion</p>
                  <p className={`text-sm p-3 rounded-md ${
                    doc.status === 'ACCEPTED'
                      ? 'text-green-700 bg-green-50'
                      : doc.status === 'REJECTED'
                        ? 'text-red-700 bg-red-50'
                        : 'text-amber-700 bg-amber-50'
                  }`}>
                    {doc.cdrDescription}
                  </p>
                </div>
              </div>
            ) : doc.sunatTicket ? (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Ticket SUNAT</p>
                  <p className="font-mono text-sm mt-1">{doc.sunatTicket}</p>
                </div>
                {doc.status !== 'ACCEPTED' && doc.status !== 'REJECTED' && doc.status !== 'VOIDED' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckTicket}
                      disabled={isCheckingTicket}
                    >
                      {isCheckingTicket ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Consultando...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Consultar Ticket
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Ticket procesado</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin respuesta de SUNAT aun</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Back button */}
      <div className="mt-6 pt-4 border-t">
        <Button variant="ghost" onClick={() => navigate('/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />Volver a Documentos
        </Button>
      </div>

      {/* Void Document Dialog */}
      <VoidDocumentDialog
        open={voidDialogOpen}
        onClose={() => setVoidDialogOpen(false)}
        documentId={doc.documentId}
        documentType={doc.type}
        issueDate={input?.issueDate ?? ''}
        onSuccess={handleVoidSuccess}
      />
    </div>
  )
}
