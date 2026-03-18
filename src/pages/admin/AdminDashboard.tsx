import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Activity, FileText, DollarSign, TrendingUp, Crown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { getAdminDashboard, getAdminRevenue } from '@/api/admin'
import type { DashboardData, RevenueData } from '@/api/admin'

function formatCurrency(value: number): string {
  return `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function formatMonthLabel(month: string): string {
  const parts = month.split('-')
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthIndex = parseInt(parts[1] ?? '1', 10) - 1
  return `${monthNames[monthIndex]} ${(parts[0] ?? '').slice(2)}`
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  const { data: dashboard, isLoading: dashLoading } = useQuery<DashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
    refetchInterval: 60_000,
  })

  const { data: revenue, isLoading: revLoading } = useQuery<RevenueData>({
    queryKey: ['admin-revenue'],
    queryFn: getAdminRevenue,
    refetchInterval: 60_000,
  })

  const isLoading = dashLoading || revLoading

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-9 w-60 mb-6" />
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

  const cards = [
    {
      title: 'Total Tenants',
      value: dashboard?.totalTenants ?? 0,
      icon: Users,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Tenants Activos',
      value: dashboard?.activeTenants ?? 0,
      icon: Activity,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
    },
    {
      title: 'Docs este mes',
      value: dashboard?.totalDocumentsThisMonth ?? 0,
      icon: FileText,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'MRR',
      value: formatCurrency(dashboard?.mrr ?? 0),
      icon: DollarSign,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600',
    },
  ]

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Metricas globales de la plataforma SUIT</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
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
                <p className={`text-2xl font-bold mt-2 ${card.valueColor ?? ''}`}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* MRR Chart + Top Tenants */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* MRR Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              MRR - Ultimos 12 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenue && revenue.months.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenue.months} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={formatMonthLabel} />
                  <YAxis tickFormatter={(v: number) => `S/${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'MRR']}
                    labelFormatter={(label: string) => formatMonthLabel(label)}
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="MRR"
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

        {/* Top Tenants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Top Tenants (este mes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.topTenants && dashboard.topTenants.length > 0 ? (
              <div className="space-y-4">
                {dashboard.topTenants.map((tenant, idx) => (
                  <div
                    key={tenant.id}
                    className="flex items-start justify-between gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md -mx-2 transition-colors"
                    onClick={() => navigate('/admin-abp/tenants')}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        <p className="text-sm font-medium truncate">{tenant.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">RUC: {tenant.ruc}</p>
                    </div>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {tenant.documentsThisMonth} docs
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Sin actividad este mes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
