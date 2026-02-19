import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Files, PlusCircle, Users, Settings, LogOut, FileText, Receipt,
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
  { label: 'Usuarios', icon: Users, path: '/users', roles: ['admin'] },
  { label: 'Configuracion', icon: Settings, path: '/settings', roles: ['admin'] },
]

interface MobileSidebarProps {
  open: boolean
  onClose: () => void
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  )

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 lg:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background p-6 shadow-lg lg:hidden">
        <div className="flex items-center gap-2 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-primary">sunatmw</h2>
            <p className="text-xs text-muted-foreground">Facturacion Electronica</p>
          </div>
        </div>

        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); onClose() }}
                className={cn(
                  'flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'text-primary bg-primary/10 font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <Separator className="my-4" />

        <button
          onClick={() => { logout(); onClose() }}
          className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Cerrar sesion</span>
        </button>
      </div>
    </>
  )
}
