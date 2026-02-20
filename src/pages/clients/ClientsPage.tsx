import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Pencil, Trash2, Search, X, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getClients, createClient, updateClient, deleteClient } from '@/api/clients'
import type { CreateClientInput, UpdateClientInput } from '@/api/clients'
import type { Client } from '@/types'

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const DOC_TYPES: Record<string, string> = {
  '6': 'RUC',
  '1': 'DNI',
  '4': 'CE',
  '7': 'Pasaporte',
  '0': 'Otros',
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Activo</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Inactivo</Badge>
  )
}

function DocTypeBadge({ type }: { type: string }) {
  const label = DOC_TYPES[type] || type
  return (
    <Badge variant="outline" className="gap-1">
      {label}
    </Badge>
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

export default function ClientsPage() {
  const queryClient = useQueryClient()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deactivatingClient, setDeactivatingClient] = useState<Client | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['clients', { page, limit, search: debouncedSearch }],
    queryFn: () => getClients({ page, limit, search: debouncedSearch || undefined }),
  })

  const clients = data?.data ?? []
  const pagination = data?.pagination

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setShowCreateModal(false)
      setToast('Cliente creado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateClientInput }) => updateClient(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setEditingClient(null)
      setToast('Cliente actualizado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setDeactivatingClient(null)
      setToast('Cliente desactivado exitosamente')
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    if (pagination && page < pagination.totalPages) {
      setPage((p) => p + 1)
    }
  }, [pagination, page])

  return (
    <div>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra los clientes de tu empresa</p>
        </div>
        <Button onClick={() => { setShowCreateModal(true); setFormError(null) }}>
          <UserPlus className="h-4 w-4 mr-2" />Crear Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)}
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No hay clientes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch ? 'No se encontraron resultados' : 'Crea el primer cliente de tu empresa'}
          </p>
          {!debouncedSearch && (
            <Button className="mt-4" onClick={() => { setShowCreateModal(true); setFormError(null) }}>
              <UserPlus className="h-4 w-4 mr-2" />Crear Cliente
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Tipo Doc</TableHead>
                    <TableHead className="w-[130px]">Numero</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[120px]">Telefono</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell><DocTypeBadge type={client.documentType} /></TableCell>
                      <TableCell className="font-mono text-sm">{client.documentNumber}</TableCell>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.email || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.phone || '-'}</TableCell>
                      <TableCell><StatusBadge isActive={client.isActive} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar cliente"
                            onClick={() => { setEditingClient(client); setFormError(null) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Desactivar cliente"
                            onClick={() => { setDeactivatingClient(client); setFormError(null) }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
            {clients.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{client.name}</span>
                      <p className="text-sm text-muted-foreground">{client.email || '-'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingClient(client); setFormError(null) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setDeactivatingClient(client); setFormError(null) }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocTypeBadge type={client.documentType} />
                      <span className="text-sm font-mono">{client.documentNumber}</span>
                      <StatusBadge isActive={client.isActive} />
                    </div>
                    <span className="text-xs text-muted-foreground">{client.phone || ''}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} clientes)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={page >= pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          error={formError}
          isLoading={createMutation.isPending}
          onClose={() => { setShowCreateModal(false); setFormError(null) }}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          error={formError}
          isLoading={updateMutation.isPending}
          onClose={() => { setEditingClient(null); setFormError(null) }}
          onSubmit={(input) => updateMutation.mutate({ id: editingClient.id, input })}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingClient && (
        <DeactivateModal
          client={deactivatingClient}
          error={formError}
          isLoading={deleteMutation.isPending}
          onClose={() => { setDeactivatingClient(null); setFormError(null) }}
          onConfirm={() => deleteMutation.mutate(deactivatingClient.id)}
        />
      )}
    </div>
  )
}

/* --- Create Client Modal ------------------------------------------------ */

interface CreateClientModalProps {
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: CreateClientInput) => void
}

function CreateClientModal({ error, isLoading, onClose, onSubmit }: CreateClientModalProps) {
  const [documentType, setDocumentType] = useState('6')
  const [documentNumber, setDocumentNumber] = useState('')
  const [name, setName] = useState('')
  const [tradeName, setTradeName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!documentNumber.trim()) {
      setValidationError('El numero de documento es requerido')
      return
    }
    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Ingrese un email valido')
      return
    }

    onSubmit({
      documentType,
      documentNumber: documentNumber.trim(),
      name: name.trim(),
      tradeName: tradeName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">Crear Cliente</h2>
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
            <Label htmlFor="create-doctype">Tipo de Documento</Label>
            <select
              id="create-doctype"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(DOC_TYPES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-docnumber">Numero de Documento</Label>
            <Input
              id="create-docnumber"
              placeholder={documentType === '6' ? '20XXXXXXXXX' : 'Numero'}
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-name">Nombre / Razon Social</Label>
            <Input
              id="create-name"
              placeholder="Nombre completo o razon social"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-tradename">Nombre Comercial</Label>
            <Input
              id="create-tradename"
              placeholder="Opcional"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-phone">Telefono</Label>
            <Input
              id="create-phone"
              placeholder="+51 999 999 999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-address">Direccion</Label>
            <Input
              id="create-address"
              placeholder="Direccion completa"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* --- Edit Client Modal -------------------------------------------------- */

interface EditClientModalProps {
  client: Client
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: UpdateClientInput) => void
}

function EditClientModal({ client, error, isLoading, onClose, onSubmit }: EditClientModalProps) {
  const [documentType, setDocumentType] = useState(client.documentType)
  const [documentNumber, setDocumentNumber] = useState(client.documentNumber)
  const [name, setName] = useState(client.name)
  const [tradeName, setTradeName] = useState(client.tradeName || '')
  const [email, setEmail] = useState(client.email || '')
  const [phone, setPhone] = useState(client.phone || '')
  const [address, setAddress] = useState(client.address || '')
  const [isActive, setIsActive] = useState(client.isActive)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!documentNumber.trim()) {
      setValidationError('El numero de documento es requerido')
      return
    }
    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError('Ingrese un email valido')
      return
    }

    onSubmit({
      documentType,
      documentNumber: documentNumber.trim(),
      name: name.trim(),
      tradeName: tradeName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">Editar Cliente</h2>
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
            <Label htmlFor="edit-doctype">Tipo de Documento</Label>
            <select
              id="edit-doctype"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(DOC_TYPES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-docnumber">Numero de Documento</Label>
            <Input
              id="edit-docnumber"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre / Razon Social</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-tradename">Nombre Comercial</Label>
            <Input
              id="edit-tradename"
              placeholder="Opcional"
              value={tradeName}
              onChange={(e) => setTradeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-phone">Telefono</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-address">Direccion</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
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

/* --- Deactivate Confirmation Modal -------------------------------------- */

interface DeactivateModalProps {
  client: Client
  error: string | null
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeactivateModal({ client, error, isLoading, onClose, onConfirm }: DeactivateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Desactivar Cliente</h2>
          <p className="text-sm text-muted-foreground">
            Esta seguro que desea desactivar a <span className="font-medium text-foreground">{client.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            El cliente no aparecera en las busquedas de documentos.
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
