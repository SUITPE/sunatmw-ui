import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle2, XCircle, Clock, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentTypeBadge } from '@/components/shared/DocumentTypeBadge'
import { useDashboardDocuments } from '@/hooks/useDocuments'
import { useAuthStore } from '@/stores/auth.store'

const statsCards = [
  { title: 'Total Emitidos', icon: FileText, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', countKey: 'total' },
  { title: 'Aceptados', icon: CheckCircle2, iconBg: 'bg-green-100', iconColor: 'text-green-600', countKey: 'accepted', valueColor: 'text-green-600' },
  { title: 'Rechazados', icon: XCircle, iconBg: 'bg-red-100', iconColor: 'text-red-600', countKey: 'rejected', valueColor: 'text-red-600' },
  { title: 'Pendientes', icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', countKey: 'pending', valueColor: 'text-amber-600' },
] as const

function computeStats(documents: Array<{ status: string }>) {
  const total = documents.length
  const accepted = documents.filter((d) => d.status === 'ACCEPTED').length
  const rejected = documents.filter((d) => d.status === 'REJECTED').length
  const pending = documents.filter((d) => ['PENDING', 'SENT'].includes(d.status)).length
  return { total, accepted, rejected, pending }
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { data, isLoading } = useDashboardDocuments()

  const documents = data?.data ?? []
  const stats = computeStats(documents)
  const canEmit = user?.role === 'admin' || user?.role === 'facturador'

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen de actividad de facturacion</p>
        <div className="flex flex-col items-center justify-center py-24">
          <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">Aun no tienes documentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Emite tu primer comprobante electronico para comenzar</p>
          {canEmit && (
            <Button className="mt-4" onClick={() => navigate('/emit')}>
              <PlusCircle className="h-4 w-4 mr-2" />Emitir mi primer documento
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen de actividad de facturacion</p>
        </div>
        {canEmit && (
          <Button onClick={() => navigate('/emit')}>
            <PlusCircle className="h-4 w-4 mr-2" />Emitir Documento
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon
          const count = stats[card.countKey]
          return (
            <Card key={card.countKey}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`rounded-full p-2 ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                </div>
                <p className={`text-3xl font-bold mt-2 ${'valueColor' in card ? card.valueColor : ''}`}>{count}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Ultimos Documentos</CardTitle>
            <Button variant="link" className="text-sm text-primary p-0 h-auto" onClick={() => navigate('/documents')}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Tipo</TableHead>
                  <TableHead className="w-[140px]">Serie-Numero</TableHead>
                  <TableHead className="hidden md:table-cell">Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.slice(0, 10).map((doc) => (
                  <TableRow
                    key={doc.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <TableCell><DocumentTypeBadge type={doc.type} /></TableCell>
                    <TableCell className="font-mono text-sm">{doc.documentId}</TableCell>
                    <TableCell className="hidden md:table-cell"><StatusBadge status={doc.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(doc.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <div className="p-4 border-t">
            <Button variant="link" className="text-sm text-primary p-0 h-auto" onClick={() => navigate('/documents')}>
              Ver todos los documentos →
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Por Tipo de Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentTypeList documents={documents} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DocumentTypeList({ documents }: { documents: Array<{ type: string }> }) {
  const typeCounts: Record<string, number> = {}
  for (const doc of documents) {
    typeCounts[doc.type] = (typeCounts[doc.type] ?? 0) + 1
  }

  const typeNames: Record<string, string> = {
    '01': 'Facturas', '03': 'Boletas', '07': 'Notas de Credito',
    '08': 'Notas de Debito', '09': 'Guias', '20': 'Retenciones',
    '40': 'Percepciones', 'RA': 'Com. de Baja',
  }

  const typeColors: Record<string, string> = {
    '01': 'bg-blue-500', '03': 'bg-indigo-500', '07': 'bg-orange-500',
    '08': 'bg-rose-500', '09': 'bg-teal-500', '20': 'bg-purple-500',
    '40': 'bg-violet-500', 'RA': 'bg-gray-500',
  }

  const entries = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-3">
      {entries.map(([type, count]) => (
        <div key={type} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${typeColors[type] ?? 'bg-gray-500'}`} />
            <span className="text-sm">{typeNames[type] ?? type}</span>
          </div>
          <span className="text-sm font-medium">{count}</span>
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-2 mt-2">
        <span className="text-sm font-medium">Total</span>
        <span className="text-sm font-bold">{documents.length}</span>
      </div>
    </div>
  )
}
