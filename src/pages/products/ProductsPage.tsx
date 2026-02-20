import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, Plus, Pencil, Trash2, Search, X, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getProducts, createProduct, updateProduct, deleteProduct } from '@/api/products'
import type { CreateProductInput, UpdateProductInput } from '@/api/products'
import type { Product } from '@/types'

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const UNIT_LABELS: Record<string, string> = {
  'NIU': 'Unidad',
  'ZZ': 'Servicio',
  'KGM': 'Kilogramo',
}

const IGV_LABELS: Record<string, string> = {
  '10': 'Gravado',
  '20': 'Exonerado',
  '30': 'Inafecto',
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">Activo</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">Inactivo</Badge>
  )
}

function IgvBadge({ igvType }: { igvType: string }) {
  const label = IGV_LABELS[igvType] || igvType
  const variant = igvType === '10' ? 'default' : 'outline'
  return (
    <Badge variant={variant} className="gap-1">
      {label}
    </Badge>
  )
}

function formatPrice(price: string): string {
  const num = parseFloat(price)
  if (isNaN(num)) return `S/ ${price}`
  return `S/ ${num.toFixed(2)}`
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

export default function ProductsPage() {
  const queryClient = useQueryClient()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deactivatingProduct, setDeactivatingProduct] = useState<Product | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterIgvType, setFilterIgvType] = useState('')
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

  // Reset page on filter change
  useEffect(() => {
    setPage(1)
  }, [filterCategory, filterIgvType])

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, limit, search: debouncedSearch, category: filterCategory, igvType: filterIgvType }],
    queryFn: () => getProducts({
      page,
      limit,
      search: debouncedSearch || undefined,
      category: filterCategory || undefined,
      igvType: filterIgvType || undefined,
    }),
  })

  const products = data?.data ?? []
  const pagination = data?.pagination

  // Mutations
  const createMutation = useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setShowCreateModal(false)
      setToast('Producto creado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) => updateProduct(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setEditingProduct(null)
      setToast('Producto actualizado exitosamente')
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeactivatingProduct(null)
      setToast('Producto desactivado exitosamente')
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
          <h1 className="text-3xl font-bold">Gestion de Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra los productos y servicios de tu empresa</p>
        </div>
        <Button onClick={() => { setShowCreateModal(true); setFormError(null) }}>
          <Plus className="h-4 w-4 mr-2" />Crear Producto
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o codigo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`${selectClassName} w-full sm:w-40`}
        >
          <option value="">Categoria</option>
          <option value="producto">Producto</option>
          <option value="servicio">Servicio</option>
        </select>
        <select
          value={filterIgvType}
          onChange={(e) => setFilterIgvType(e.target.value)}
          className={`${selectClassName} w-full sm:w-40`}
        >
          <option value="">Tipo IGV</option>
          {Object.entries(IGV_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-0">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 mx-4 my-2" />)}
          </CardContent>
        </Card>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No hay productos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {debouncedSearch || filterCategory || filterIgvType
              ? 'No se encontraron resultados'
              : 'Crea el primer producto de tu empresa'}
          </p>
          {!debouncedSearch && !filterCategory && !filterIgvType && (
            <Button className="mt-4" onClick={() => { setShowCreateModal(true); setFormError(null) }}>
              <Plus className="h-4 w-4 mr-2" />Crear Producto
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
                    <TableHead className="w-[100px]">Codigo</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[110px]">Precio</TableHead>
                    <TableHead className="w-[100px]">Unidad</TableHead>
                    <TableHead className="w-[110px]">Tipo IGV</TableHead>
                    <TableHead className="w-[110px]">Categoria</TableHead>
                    <TableHead className="w-[100px]">Estado</TableHead>
                    <TableHead className="w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.code || '-'}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm font-mono">{formatPrice(product.unitPrice)}</TableCell>
                      <TableCell className="text-sm">{UNIT_LABELS[product.unitOfMeasure] || product.unitOfMeasure}</TableCell>
                      <TableCell><IgvBadge igvType={product.igvType} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground capitalize">{product.category || '-'}</TableCell>
                      <TableCell><StatusBadge isActive={product.isActive} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Editar producto"
                            onClick={() => { setEditingProduct(product); setFormError(null) }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Desactivar producto"
                            onClick={() => { setDeactivatingProduct(product); setFormError(null) }}
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
            {products.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <p className="text-sm text-muted-foreground">{product.code || 'Sin codigo'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingProduct(product); setFormError(null) }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setDeactivatingProduct(product); setFormError(null) }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium">{formatPrice(product.unitPrice)}</span>
                      <IgvBadge igvType={product.igvType} />
                      <StatusBadge isActive={product.isActive} />
                    </div>
                    <span className="text-xs text-muted-foreground">{UNIT_LABELS[product.unitOfMeasure] || product.unitOfMeasure}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages} ({pagination.total} productos)
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

      {/* Create Product Modal */}
      {showCreateModal && (
        <CreateProductModal
          error={formError}
          isLoading={createMutation.isPending}
          onClose={() => { setShowCreateModal(false); setFormError(null) }}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          error={formError}
          isLoading={updateMutation.isPending}
          onClose={() => { setEditingProduct(null); setFormError(null) }}
          onSubmit={(input) => updateMutation.mutate({ id: editingProduct.id, input })}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {deactivatingProduct && (
        <DeactivateModal
          product={deactivatingProduct}
          error={formError}
          isLoading={deleteMutation.isPending}
          onClose={() => { setDeactivatingProduct(null); setFormError(null) }}
          onConfirm={() => deleteMutation.mutate(deactivatingProduct.id)}
        />
      )}
    </div>
  )
}

/* --- Create Product Modal ----------------------------------------------- */

interface CreateProductModalProps {
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: CreateProductInput) => void
}

function CreateProductModal({ error, isLoading, onClose, onSubmit }: CreateProductModalProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [unitOfMeasure, setUnitOfMeasure] = useState('NIU')
  const [igvType, setIgvType] = useState('10')
  const [category, setCategory] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }
    if (!unitPrice.trim() || isNaN(parseFloat(unitPrice)) || parseFloat(unitPrice) < 0) {
      setValidationError('Ingrese un precio valido')
      return
    }

    onSubmit({
      code: code.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      unitPrice: parseFloat(unitPrice).toFixed(2),
      unitOfMeasure,
      igvType,
      category: category || null,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <h2 className="text-lg font-semibold">Crear Producto</h2>
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
            <Label htmlFor="create-code">Codigo</Label>
            <Input
              id="create-code"
              placeholder="Opcional (ej: PROD-001)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-name">Nombre</Label>
            <Input
              id="create-name"
              placeholder="Nombre del producto o servicio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-description">Descripcion</Label>
            <Input
              id="create-description"
              placeholder="Descripcion opcional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-price">Precio Unitario (S/)</Label>
            <Input
              id="create-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-unit">Unidad de Medida</Label>
            <select
              id="create-unit"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(UNIT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label} ({val})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-igv">Tipo de IGV</Label>
            <select
              id="create-igv"
              value={igvType}
              onChange={(e) => setIgvType(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(IGV_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-category">Categoria</Label>
            <select
              id="create-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClassName}
            >
              <option value="">Sin categoria</option>
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* --- Edit Product Modal ------------------------------------------------- */

interface EditProductModalProps {
  product: Product
  error: string | null
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: UpdateProductInput) => void
}

function EditProductModal({ product, error, isLoading, onClose, onSubmit }: EditProductModalProps) {
  const [code, setCode] = useState(product.code || '')
  const [name, setName] = useState(product.name)
  const [description, setDescription] = useState(product.description || '')
  const [unitPrice, setUnitPrice] = useState(product.unitPrice)
  const [unitOfMeasure, setUnitOfMeasure] = useState(product.unitOfMeasure)
  const [igvType, setIgvType] = useState(product.igvType)
  const [category, setCategory] = useState(product.category || '')
  const [isActive, setIsActive] = useState(product.isActive)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!name.trim()) {
      setValidationError('El nombre es requerido')
      return
    }
    if (!unitPrice.trim() || isNaN(parseFloat(unitPrice)) || parseFloat(unitPrice) < 0) {
      setValidationError('Ingrese un precio valido')
      return
    }

    onSubmit({
      code: code.trim() || null,
      name: name.trim(),
      description: description.trim() || null,
      unitPrice: parseFloat(unitPrice).toFixed(2),
      unitOfMeasure,
      igvType,
      category: category || null,
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
          <h2 className="text-lg font-semibold">Editar Producto</h2>
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
            <Label htmlFor="edit-code">Codigo</Label>
            <Input
              id="edit-code"
              placeholder="Opcional"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripcion</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-price">Precio Unitario (S/)</Label>
            <Input
              id="edit-price"
              type="number"
              step="0.01"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-unit">Unidad de Medida</Label>
            <select
              id="edit-unit"
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(UNIT_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label} ({val})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-igv">Tipo de IGV</Label>
            <select
              id="edit-igv"
              value={igvType}
              onChange={(e) => setIgvType(e.target.value)}
              className={selectClassName}
            >
              {Object.entries(IGV_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Categoria</Label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={selectClassName}
            >
              <option value="">Sin categoria</option>
              <option value="producto">Producto</option>
              <option value="servicio">Servicio</option>
            </select>
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
  product: Product
  error: string | null
  isLoading: boolean
  onClose: () => void
  onConfirm: () => void
}

function DeactivateModal({ product, error, isLoading, onClose, onConfirm }: DeactivateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-2">Desactivar Producto</h2>
          <p className="text-sm text-muted-foreground">
            Esta seguro que desea desactivar <span className="font-medium text-foreground">{product.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            El producto no aparecera en las busquedas de documentos.
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
