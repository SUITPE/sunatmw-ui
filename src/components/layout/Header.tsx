import { Menu, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/hooks/useAuth'

interface HeaderProps {
  onToggleMobileSidebar: () => void
}

export function Header({ onToggleMobileSidebar }: HeaderProps) {
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuth()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '??'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 lg:h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleMobileSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold text-primary lg:hidden">sunatmw</span>
      </div>

      <div className="flex items-center gap-3">
        {user?.tenant && (
          <>
            <span className="text-sm text-muted-foreground hidden md:block">{user.tenant.name}</span>
            <Separator orientation="vertical" className="h-6 hidden md:block" />
          </>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden lg:block">{user?.name}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="w-fit mt-1 text-xs">{user?.role}</Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><User className="mr-2 h-4 w-4" />Mi perfil</DropdownMenuItem>
            {user?.role === 'admin' && (
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Configuracion</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
