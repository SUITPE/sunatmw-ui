import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Files, PlusCircle, Users, Settings,
  PanelLeftClose, PanelLeftOpen, LogOut, FileText, Receipt,
  UserSearch, Package, Banknote,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  roles?: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Documentos', icon: Files, path: '/documents' },
  { label: 'Emitir Factura', icon: PlusCircle, path: '/emit', roles: ['admin', 'facturador'] },
  { label: 'Emitir Boleta', icon: Receipt, path: '/emit-receipt', roles: ['admin', 'facturador'] },
  { label: 'Clientes', icon: UserSearch, path: '/clients' },
  { label: 'Productos', icon: Package, path: '/products' },
  { label: 'Cobranza', icon: Banknote, path: '/receivables' },
  { label: 'Usuarios', icon: Users, path: '/users', roles: ['admin'] },
  { label: 'Configuracion', icon: Settings, path: '/settings', roles: ['admin'] },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-14 lg:top-16 bottom-0 z-40 bg-background border-r border-border transition-all duration-200 hidden lg:flex lg:flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {!collapsed && (
        <div className="px-4 py-6">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-primary">sunatmw</h2>
              <p className="text-xs text-muted-foreground">Facturacion Electronica</p>
            </div>
          </div>
        </div>
      )}

      {collapsed && <div className="py-4" />}

      <nav className="flex-1 px-2 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 w-full rounded-md text-sm transition-colors',
                collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                isActive
                  ? 'text-primary bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      <div className="px-2 pb-2">
        <Separator className="my-2" />
        <button
          onClick={logout}
          className={cn(
            'flex items-center gap-3 w-full rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
            collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'flex items-center gap-3 w-full rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mt-1',
            collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2'
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          {!collapsed && <span>Colapsar menu</span>}
        </button>
      </div>
    </aside>
  )
}
