import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { cn } from '@/lib/utils'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen">
      <Header onToggleMobileSidebar={() => setMobileOpen(true)} />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main
        className={cn(
          'pt-14 lg:pt-16 transition-all duration-200',
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
