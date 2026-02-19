import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Pencil, Trash2, ShieldCheck, Shield, Eye, X, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/auth.store'
import { getUsers, createUser, updateUser, deleteUser } from '@/api/users'
import type { CreateUserInput, UpdateUserInput } from '@/api/users'
import type { User } from '@/types'

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

type RoleBadgeVariant = 'default' | 'secondary' | 'outline'

const ROLE_CONFIG: Record<string, { label: string; variant: RoleBadgeVariant; icon: typeof Shield }> = {
  admin: { label: 'Admin', variant: 'default', icon: ShieldCheck },
  facturador: { label: 'Facturador', variant: 'secondary', icon: Shield },
  viewer: { label: 'Viewer', variant: 'outline', icon: Eye },
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] || { label: role, variant: 'outline' as const, icon: Eye }
  const Icon = config.icon
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Activo</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Inactivo</Badge>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function UsersPage() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Queries
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setShowCreateModal(false)
      setToast('Usuario creado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setEditingUser(null)
      setToast('Usuario actualizado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeactivatingUser(null)
      setToast('Usuario desactivado exitosamente')
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca'
    const d = new Date(dateStr)
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isCurrentUser = (userId: string) => currentUser?.id === userId

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Usuarios</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra los usuarios de tu empresa</p>
        </div>
        <Button onClick={() => { setShowCreateModal(true); setFormError(null) }}>
          <UserPlus className="h-4 w-4 mr-2" />Crear Usuario
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)}
          </CardContent>
        </Card>
      ) : !users || users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No hay usuarios</h2>
          <p className="text-sm text-muted-foreground mt-1">Crea el primer usuario de tu empresa</p>
          <Button className="mt-4" onClick={() => { setShowCreateModal(true); setFormError(null) }}>
            <UserPlus className="h-4 w-4 mr-2" />Crear Usuario
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[130px]">Rol</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[160px]">Ultimo Login</TableHead>
                    <TableHead className="w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {isCurrentUser(user.id) && (
                          <span className="ml-2 text-xs text-muted-foreground">(tu)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell><StatusBadge isActive={user.isActive} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.lastLoginAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar usuario"
                            onClick={() => { setEditingUser(user); setFormError(null) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!isCurrentUser(user.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Desactivar usuario"
                              onClick={() => { setDeactivatingUser(user); setFormError(null) }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{user.name}</span>
                      {isCurrentUser(user.id) && (
                        <span className="ml-2 text-xs text-muted-foreground">(tu)</span>
                      )}
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingUser(user); setFormError(null) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!isCurrentUser(user.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setDeactivatingUser(user); setFormError(null) }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RoleBadge role={user.role} />
                      <StatusBadge isActive={user.isActive} />
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(user.lastLoginAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          error={formError}
          isLoading={createMutation.isPending}
          onClose={() => { setShowCreateModal(false); setFormError(null) }}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isSelf={isCurrentUser(editingUser.id)}
          error={formError}
          isLoading={updateMutation.isPending}
          onClose={() => { setEditingUser(null); setFormError(null) }}
          onSubmit={(input) => updateMutation.mutate({ id: editingUser.id, input })}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingUser && (
        <DeactivateModal
          user={deactivatingUser}
          error={formError}
          isLoading={deleteMutation.isPending}
          onClose={() => { setDeactivatingUser(null); setFormError(null) }}
          onConfirm={() => deleteMutation.mutate(deactivatingUser.id)}
        />
      )}
    </div>
  )
}

/* ─── Create User Modal ──────────────────────────────────────────────── */

interface CreateUserModalProps {
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: CreateUserInput) => void
}

function CreateUserModal({ error, isLoading, onClose, onSubmit }: CreateUserModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'facturador' | 'viewer'>('viewer')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Ingrese un email valido')
      return
    }
    if (password.length < 8) {
      setValidationError('La contrasena debe tener al menos 8 caracteres')
      return
    }

    onSubmit({ name: name.trim(), email: email.trim(), password, role })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">Crear Usuario</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(validationError || error) && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {validationError || error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="create-name">Nombre</Label>
            <Input
              id="create-name"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-password">Contrasena</Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Minimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-role">Rol</Label>
            <select
              id="create-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'facturador' | 'viewer')}
              className={selectClassName}
            >
              <option value="admin">Admin</option>
              <option value="facturador">Facturador</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Edit User Modal ────────────────────────────────────────────────── */

interface EditUserModalProps {
  user: User
  isSelf: boolean
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: UpdateUserInput) => void
}

function EditUserModal({ user, isSelf, error, isLoading, onClose, onSubmit }: EditUserModalProps) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<'admin' | 'facturador' | 'viewer'>(user.role)
  const [isActive, setIsActive] = useState(user.isActive)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }

    const input: UpdateUserInput = { name: name.trim() }
    if (!isSelf) {
      input.role = role
    }
    input.isActive = isActive

    onSubmit(input)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">Editar Usuario</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {(validationError || error) && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {validationError || error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-role">Rol</Label>
            {isSelf ? (
              <div>
                <select
                  id="edit-role"
                  value={role}
                  disabled
                  className={selectClassName}
                >
                  <option value={role}>{ROLE_CONFIG[role]?.label || role}</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">No puede cambiar su propio rol</p>
              </div>
            ) : (
              <select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'facturador' | 'viewer')}
                className={selectClassName}
              >
                <option value="admin">Admin</option>
                <option value="facturador">Facturador</option>
                <option value="viewer">Viewer</option>
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-active">Estado</Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm">{isActive ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ─── Deactivate Confirmation Modal ──────────────────────────────────── */

interface DeactivateModalProps {
  user: User
  error: string | null
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeactivateModal({ user, error, isLoading, onClose, onConfirm }: DeactivateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Desactivar Usuario</h2>
          <p className="text-sm text-muted-foreground">
            Esta seguro que desea desactivar a <span className="font-medium text-foreground">{user.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            El usuario no podra acceder al sistema.
          </p>

          {error && (
            <div className="mt-3 rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Desactivando...' : 'Desactivar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
