import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Banknote, Clock, AlertTriangle, PlusCircle, FileText } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentTypeBadge } from '@/components/shared/DocumentTypeBadge'
import { useDashboardDocuments } from '@/hooks/useDocuments'
import { useAuthStore } from '@/stores/auth.store'
import { getDashboardSummary, getInvoicedVsCollected, getTopDebtors } from '@/api/reports'
import type { DashboardSummary, MonthlyData, TopDebtor } from '@/api/reports'

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return 'S/ 0.00'
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthIndex = parseInt(parts[1] ?? '1', 10) - 1
  return `${monthNames[monthIndex]} ${(parts[0] ?? '').slice(2)}`
}

const REFETCH_INTERVAL = 5 * 60 * 1000

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const canEmit = user?.role === 'admin' || user?.role === 'facturador'

  const { data: documentsData, isLoading: docsLoading } = useDashboardDocuments()
  const documents = documentsData?.data ?? []

  const { data: summary, isLoading: summaryLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    refetchInterval: REFETCH_INTERVAL,
  })

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery<MonthlyData[]>({
    queryKey: ['invoiced-vs-collected'],
    queryFn: () => getInvoicedVsCollected(6),
    refetchInterval: REFETCH_INTERVAL,
  })

  const { data: topDebtors, isLoading: debtorsLoading } = useQuery<TopDebtor[]>({
    queryKey: ['top-debtors'],
    queryFn: () => getTopDebtors(5),
    refetchInterval: REFETCH_INTERVAL,
  })

  const isLoading = summaryLoading || monthlyLoading || debtorsLoading || docsLoading

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
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    )
  }

  const summaryCards = [
    {
      title: 'Facturado este mes',
      value: formatCurrency(summary?.invoicedThisMonth ?? '0'),
      icon: TrendingUp,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Cobrado este mes',
      value: formatCurrency(summary?.collectedThisMonth ?? '0'),
      icon: Banknote,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
    },
    {
      title: 'Pendiente de cobro',
      value: formatCurrency(summary?.pendingTotal ?? '0'),
      icon: Clock,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-600',
    },
    {
      title: 'Vencido',
      value: formatCurrency(summary?.overdueTotal ?? '0'),
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
    },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Resumen financiero y de facturacion</p>
        </div>
        {canEmit && (
          <Button onClick={() => navigate('/emit')}>
            <PlusCircle className="h-4 w-4 mr-2" />Emitir Documento
          </Button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`rounded-full p-2 ${card.iconBg}`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                </div>
                <p className={`text-2xl font-bold mt-2 ${card.valueColor ?? ''}`}>{card.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Chart and Top Debtors */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Facturado vs Cobrado (ultimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData && monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonthLabel} />
                  <YAxis tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatCurrency(value ?? 0), '']}
                    labelFormatter={(label: unknown) => formatMonthLabel(String(label ?? ''))}
                  />
                  <Legend />
                  <Bar dataKey="invoiced" name="Facturado" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Cobrado" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sin datos para este periodo</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Clientes Deudores</CardTitle>
          </CardHeader>
          <CardContent>
            {topDebtors && topDebtors.length > 0 ? (
              <div className="space-y-4">
                {topDebtors.map((debtor, idx) => (
                  <div key={debtor.documentNumber} className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        <p className="text-sm font-medium truncate">{debtor.clientName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {debtor.documentNumber} - {debtor.invoiceCount} {debtor.invoiceCount === 1 ? 'factura' : 'facturas'}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-amber-600 whitespace-nowrap">
                      {formatCurrency(debtor.pendingAmount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Banknote className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sin deudores pendientes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      {documents.length > 0 && (
        <Card>
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
              Ver todos los documentos
            </Button>
          </div>
        </Card>
      )}

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Aun no tienes documentos emitidos</p>
              {canEmit && (
                <Button className="mt-4" variant="outline" onClick={() => navigate('/emit')}>
                  <PlusCircle className="h-4 w-4 mr-2" />Emitir mi primer documento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
