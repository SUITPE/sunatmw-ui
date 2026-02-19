import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, PlusCircle, Files } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentTypeBadge } from '@/components/shared/DocumentTypeBadge'
import { useDocuments } from '@/hooks/useDocuments'
import { useAuthStore } from '@/stores/auth.store'

const DOC_TYPES = [
  { value: '', label: 'Todos los tipos' },
  { value: '01', label: 'Factura (01)' },
  { value: '03', label: 'Boleta (03)' },
  { value: '07', label: 'Nota de Credito (07)' },
  { value: '08', label: 'Nota de Debito (08)' },
  { value: '09', label: 'Guia de Remision (09)' },
  { value: '20', label: 'Retencion (20)' },
  { value: '40', label: 'Percepcion (40)' },
]

const DOC_STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ERROR', label: 'Error' },
  { value: 'VOIDED', label: 'Anulado' },
  { value: 'OBSERVED', label: 'Observado' },
]

export default function DocumentListPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canEmit = user?.role === 'admin' || user?.role === 'facturador'

  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const limit = 20

  const { data, isLoading } = useDocuments({
    page,
    limit,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  })

  const documents = data?.data ?? []
  const pagination = data?.pagination

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.toLowerCase()
    return documents.filter((d) => d.documentId.toLowerCase().includes(q))
  }, [documents, search])

  const hasFilters = typeFilter || statusFilter || search

  const clearFilters = () => {
    setTypeFilter('')
    setStatusFilter('')
    setSearch('')
    setPage(1)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground text-sm mt-1">Consulta y gestiona tus comprobantes electronicos</p>
        </div>
        {canEmit && (
          <Button onClick={() => navigate('/emit')}>
            <PlusCircle className="h-4 w-4 mr-2" />Emitir Documento
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por serie-numero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[150px]"
        >
          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm w-[150px]"
        >
          {DOC_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)}
          </CardContent>
        </Card>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Files className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">
            {hasFilters ? 'No se encontraron documentos' : 'Aun no tienes documentos'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {hasFilters ? 'Intenta modificar los filtros de busqueda' : 'Emite tu primer comprobante electronico'}
          </p>
          {hasFilters ? (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>Limpiar filtros</Button>
          ) : canEmit ? (
            <Button className="mt-4" onClick={() => navigate('/emit')}>Emitir Documento</Button>
          ) : null}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Fecha</TableHead>
                    <TableHead className="w-[80px]">Tipo</TableHead>
                    <TableHead className="w-[160px]">Serie-Numero</TableHead>
                    <TableHead className="w-[120px]">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => (
                    <TableRow
                      key={doc.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                      <TableCell><DocumentTypeBadge type={doc.type} /></TableCell>
                      <TableCell className="font-mono text-sm font-medium">{doc.documentId}</TableCell>
                      <TableCell><StatusBadge status={doc.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {filteredDocs.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DocumentTypeBadge type={doc.type} />
                      <span className="font-mono text-sm font-medium">{doc.documentId}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={doc.status} />
                    <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 mt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {(pagination.page - 1) * pagination.limit + 1}-
                {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} documentos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Pagina {page} de {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
