import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Pencil, X, Info, Clock, CalendarCheck, CalendarClock, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getReminderConfigs, updateReminderConfig } from '@/api/reminders'
import type { ReminderConfig, UpdateReminderConfigInput } from '@/api/reminders'

const TYPE_LABELS: Record<string, string> = {
  before_due: 'Antes del vencimiento',
  on_due: 'El dia del vencimiento',
  after_due: 'Despues del vencimiento',
}

const TYPE_COLORS: Record<string, string> = {
  before_due: 'bg-blue-100 text-blue-800 border-blue-200',
  on_due: 'bg-amber-100 text-amber-800 border-amber-200',
  after_due: 'bg-red-100 text-red-800 border-red-200',
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'before_due':
      return CalendarClock
    case 'on_due':
      return CalendarCheck
    case 'after_due':
      return Clock
    default:
      return Bell
  }
}

function getDaysLabel(config: ReminderConfig): string {
  if (config.daysOffset === 0) return 'El mismo dia'
  if (config.daysOffset < 0) return `${Math.abs(config.daysOffset)} dias antes`
  return `${config.daysOffset} dias despues`
}

const TEMPLATE_VARIABLES = [
  { variable: '{clientName}', description: 'Nombre del cliente' },
  { variable: '{invoiceNumber}', description: 'Numero de factura' },
  { variable: '{amount}', description: 'Monto pendiente' },
  { variable: '{currency}', description: 'Moneda (PEN/USD)' },
  { variable: '{dueDate}', description: 'Fecha de vencimiento' },
]

interface ToastState {
  message: string
  type: 'success' | 'error'
}

function Toast({ message, type, onClose }: ToastState & { onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border bg-background px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2">
      {type === 'success' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function RemindersPage() {
  const queryClient = useQueryClient()
  const [editingConfig, setEditingConfig] = useState<ReminderConfig | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  const clearToast = useCallback(() => setToast(null), [])

  const { data: configs, isLoading } = useQuery({
    queryKey: ['reminder-configs'],
    queryFn: getReminderConfigs,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateReminderConfig(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-configs'] })
      setToast({ message: 'Estado del recordatorio actualizado', type: 'success' })
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateReminderConfigInput }) =>
      updateReminderConfig(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminder-configs'] })
      setEditingConfig(null)
      setToast({ message: 'Plantilla de recordatorio actualizada', type: 'success' })
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' })
    },
  })

  const handleToggle = (config: ReminderConfig) => {
    toggleMutation.mutate({ id: config.id, isActive: !config.isActive })
  }

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="text-3xl font-bold">Recordatorios de Pago</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configura las plantillas de recordatorios automaticos para tus clientes
          </p>
        </div>
      </div>

      {/* Variables hint */}
      <div className="mb-6 rounded-lg border bg-muted/50 p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium mb-2">Variables disponibles para las plantillas</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <code
                  key={v.variable}
                  className="rounded bg-background border px-2 py-0.5 text-xs font-mono"
                  title={v.description}
                >
                  {v.variable}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Configs list */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !configs || configs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Bell className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-medium">No hay configuraciones</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No se encontraron plantillas de recordatorios configuradas
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {configs.map((config) => {
            const Icon = getTypeIcon(config.type)
            return (
              <Card
                key={config.id}
                className={`transition-opacity ${!config.isActive ? 'opacity-60' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <Badge className={`${TYPE_COLORS[config.type] || ''} hover:${TYPE_COLORS[config.type] || ''}`}>
                          {TYPE_LABELS[config.type] || config.type}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getDaysLabel(config)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.isActive}
                        onClick={() => handleToggle(config)}
                        disabled={toggleMutation.isPending}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.isActive ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Asunto</p>
                      <p className="text-sm font-medium truncate">{config.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Mensaje</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{config.body}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingConfig(config)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Editar plantilla
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingConfig && (
        <EditReminderModal
          config={editingConfig}
          isLoading={updateMutation.isPending}
          onClose={() => setEditingConfig(null)}
          onSubmit={(input) =>
            updateMutation.mutate({ id: editingConfig.id, input })
          }
        />
      )}
    </div>
  )
}

/* --- Edit Reminder Modal ------------------------------------------------ */

interface EditReminderModalProps {
  config: ReminderConfig
  isLoading: boolean
  onClose: () => void
  onSubmit: (input: UpdateReminderConfigInput) => void
}

function EditReminderModal({ config, isLoading, onClose, onSubmit }: EditReminderModalProps) {
  const [subject, setSubject] = useState(config.subject)
  const [body, setBody] = useState(config.body)
  const [isActive, setIsActive] = useState(config.isActive)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!subject.trim()) {
      setValidationError('El asunto es requerido')
      return
    }
    if (!body.trim()) {
      setValidationError('El mensaje es requerido')
      return
    }

    onSubmit({
      subject: subject.trim(),
      body: body.trim(),
      isActive,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-lg border shadow-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-lg font-semibold">Editar Plantilla</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {TYPE_LABELS[config.type]} - {getDaysLabel(config)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {validationError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-subject">Asunto del email</Label>
            <Input
              id="edit-subject"
              placeholder="Recordatorio de pago - {invoiceNumber}"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-body">Mensaje</Label>
            <textarea
              id="edit-body"
              rows={6}
              placeholder="Estimado {clientName}, le recordamos que la factura {invoiceNumber} por {amount} {currency} vence el {dueDate}."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Variables hint inside modal */}
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Variables disponibles:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <button
                  key={v.variable}
                  type="button"
                  onClick={() => setBody((prev) => prev + v.variable)}
                  className="rounded bg-background border px-2 py-0.5 text-xs font-mono hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                  title={`Insertar ${v.variable} - ${v.description}`}
                >
                  {v.variable}
                </button>
              ))}
            </div>
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
