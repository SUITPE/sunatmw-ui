import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, DollarSign, LogOut, Shield, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { adminLogout, isAdminAuthenticated } from '@/api/admin'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin-abp/dashboard', icon: LayoutDashboard },
  { label: 'Tenants', path: '/admin-abp/tenants', icon: Users },
  { label: 'Revenue', path: '/admin-abp/revenue', icon: DollarSign },
]

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-full bg-background border-r transition-all duration-200 hidden lg:flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b gap-3">
        <Shield className="h-6 w-6 text-primary shrink-0" />
        {!collapsed && <span className="font-bold text-primary">SUIT Admin</span>}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-8 w-8"
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t">
        <NavLink
          to="/admin-abp"
          onClick={(e) => {
            e.preventDefault()
            adminLogout()
            window.location.href = '/admin-abp'
          }}
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesion</span>}
        </NavLink>
      </div>
    </aside>
  )
}

function AdminMobileHeader({ onMenuOpen }: { onMenuOpen: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background border-b flex items-center px-4 lg:hidden">
      <Button variant="ghost" size="icon" onClick={onMenuOpen}>
        <Menu className="h-5 w-5" />
      </Button>
      <Shield className="h-5 w-5 text-primary ml-2" />
      <span className="font-bold text-primary ml-2">SUIT Admin</span>
    </header>
  )
}

function AdminMobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-0 z-50 h-full w-64 bg-background border-r lg:hidden flex flex-col">
        <div className="h-14 flex items-center px-4 border-b justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-bold text-primary">SUIT Admin</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={() => {
              adminLogout()
              window.location.href = '/admin-abp'
            }}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground w-full"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Redirect if not authenticated
  if (!isAdminAuthenticated()) {
    navigate('/admin-abp', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen">
      <AdminMobileHeader onMenuOpen={() => setMobileOpen(true)} />
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <AdminMobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main
        className={cn(
          'pt-14 lg:pt-0 transition-all duration-200',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
