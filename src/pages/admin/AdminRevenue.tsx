import { useQuery } from '@tanstack/react-query'
import { DollarSign, TrendingUp, Users } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAdminRevenue } from '@/api/admin'
import type { RevenueData } from '@/api/admin'

function formatCurrency(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthIndex = parseInt(parts[1] ?? '1', 10) - 1
  return `${monthNames[monthIndex]} ${(parts[0] ?? '').slice(2)}`
}

function formatMonthFull(month: string): string {
  const parts = month.split('-')
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const monthIndex = parseInt(parts[1] ?? '1', 10) - 1
  return `${monthNames[monthIndex]} ${parts[0]}`
}

export default function AdminRevenue() {
  const { data: revenue, isLoading } = useQuery<RevenueData>({
    queryKey: ['admin-revenue'],
    queryFn: getAdminRevenue,
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-40 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96 mb-8" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const months = revenue?.months ?? []
  const currentMonth = months[months.length - 1]
  const previousMonth = months.length >= 2 ? months[months.length - 2] : undefined

  const mrrGrowth = currentMonth && previousMonth && previousMonth.mrr > 0
    ? (((currentMonth.mrr - previousMonth.mrr) / previousMonth.mrr) * 100).toFixed(1)
    : '0'

  const totalRevenue12m = months.reduce((sum, m) => sum + m.mrr, 0)

  const summaryCards = [
    {
      title: 'MRR Actual',
      value: formatCurrency(currentMonth?.mrr ?? 0),
      icon: DollarSign,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
    {
      title: 'Crecimiento MoM',
      value: `${mrrGrowth}%`,
      icon: TrendingUp,
      iconBg: parseFloat(mrrGrowth) >= 0 ? 'bg-green-100' : 'bg-red-100',
      iconColor: parseFloat(mrrGrowth) >= 0 ? 'text-green-600' : 'text-red-600',
      valueColor: parseFloat(mrrGrowth) >= 0 ? 'text-green-600' : 'text-red-600',
    },
    {
      title: 'Revenue 12M',
      value: formatCurrency(totalRevenue12m),
      icon: DollarSign,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Revenue</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial de ingresos recurrentes mensuales (MRR)</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      {/* MRR Trend Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            MRR Trend (12 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={months} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} />
                <YAxis tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'mrr') return [formatCurrency(Number(value) || 0), 'MRR']
                    return [Number(value) || 0, 'Tenants']
                  }}
                  labelFormatter={(label: any) => formatMonthFull(String(label))}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  name="mrr"
                  stroke="#8b5cf6"
                  fill="#8b5cf680"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Sin datos de revenue</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tenants Growth Chart */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Tenants Activos por Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {months.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={months} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonthLabel} />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [Number(value) || 0, 'Tenants']}
                  labelFormatter={(label: any) => formatMonthFull(String(label))}
                />
                <Legend />
                <Bar dataKey="tenants" name="Tenants Activos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Desglose Mensual</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">MRR</TableHead>
                <TableHead className="text-right">Tenants</TableHead>
                <TableHead className="text-right hidden sm:table-cell">ARPU</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...months].reverse().map((m) => (
                <TableRow key={m.month}>
                  <TableCell className="font-medium">{formatMonthFull(m.month)}</TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(m.mrr)}</TableCell>
                  <TableCell className="text-right">{m.tenants}</TableCell>
                  <TableCell className="text-right font-mono hidden sm:table-cell">
                    {m.tenants > 0 ? formatCurrency(Math.round(m.mrr / m.tenants)) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
