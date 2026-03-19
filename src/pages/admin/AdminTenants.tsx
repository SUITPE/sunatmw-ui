import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MoreHorizontal, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getAdminTenants,
  updateTenantPlan,
  suspendTenant,
  reactivateTenant,
} from '@/api/admin'
import type { AdminTenantsResponse, AdminTenant } from '@/api/admin'

const PLANS = ['starter', 'business', 'pro', 'enterprise'] as const
const STATUSES = ['active', 'suspended'] as const

function planBadgeColor(plan: string): string {
  switch (plan) {
    case 'starter': return 'bg-gray-100 text-gray-700'
    case 'business': return 'bg-blue-100 text-blue-700'
    case 'pro': return 'bg-purple-100 text-purple-700'
    case 'enterprise': return 'bg-amber-100 text-amber-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

function statusBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' {
  return status === 'active' ? 'default' : 'destructive'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function AdminTenants() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const limit = 15

  const { data, isLoading } = useQuery<AdminTenantsResponse>({
    queryKey: ['admin-tenants', search, planFilter, statusFilter, page],
    queryFn: () => getAdminTenants({
      search: search || undefined,
      plan: planFilter || undefined,
      status: statusFilter || undefined,
      page,
      limit,
    }),
    placeholderData: (prev) => prev,
  })

  const changePlanMutation = useMutation({
    mutationFn: ({ tenantId, plan }: { tenantId: string; plan: string }) =>
      updateTenantPlan(tenantId, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const suspendMutation = useMutation({
    mutationFn: (tenantId: string) => suspendTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: (tenantId: string) => reactivateTenant(tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] })
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
  })

  const tenants = data?.data ?? []
  const pagination = data?.pagination

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  if (isLoading && !data) {
    return (
      <div>
        <Skeleton className="h-9 w-40 mb-6" />
        <Skeleton className="h-12 mb-4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gestion de tenants de la plataforma ({pagination?.total ?? 0} total)
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o RUC..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-10"
              />
            </div>

            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todos los planes</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="h-10 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todos los estados</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>

            {(search || planFilter || statusFilter) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => { setSearch(''); setPlanFilter(''); setStatusFilter(''); setPage(1) }}
              >
                Limpiar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">RUC</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Docs/mes</TableHead>
                <TableHead className="hidden lg:table-cell">Ultima actividad</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No se encontraron tenants
                  </TableCell>
                </TableRow>
              )}
              {tenants.map((tenant) => (
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  onChangePlan={(plan) => changePlanMutation.mutate({ tenantId: tenant.id, plan })}
                  onSuspend={() => suspendMutation.mutate(tenant.id)}
                  onReactivate={() => reactivateMutation.mutate(tenant.id)}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Pagina {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente<ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function TenantRow({
  tenant,
  onChangePlan,
  onSuspend,
  onReactivate,
}: {
  tenant: AdminTenant
  onChangePlan: (plan: string) => void
  onSuspend: () => void
  onReactivate: () => void
}) {
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-sm">{tenant.name}</p>
          <p className="text-xs text-muted-foreground md:hidden">{tenant.ruc}</p>
        </div>
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono text-sm">{tenant.ruc}</TableCell>
      <TableCell>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${planBadgeColor(tenant.plan)}`}>
          {tenant.plan}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={statusBadgeVariant(tenant.status)}>
          {tenant.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right font-mono">{tenant.documentsThisMonth}</TableCell>
      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatDate(tenant.lastActive)}</TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Cambiar plan</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PLANS.map((plan) => (
                  <DropdownMenuItem
                    key={plan}
                    onClick={() => onChangePlan(plan)}
                    disabled={tenant.plan === plan}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${plan === tenant.plan ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                    {plan === tenant.plan && ' (actual)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            {tenant.status === 'active' ? (
              <DropdownMenuItem onClick={onSuspend} className="text-destructive">
                <Ban className="h-4 w-4 mr-2" />Suspender
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={onReactivate} className="text-green-600">
                <CheckCircle className="h-4 w-4 mr-2" />Reactivar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
