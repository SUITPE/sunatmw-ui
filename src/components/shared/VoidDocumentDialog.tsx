import { useState } from 'react'
import { Ban, Loader2, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { voidDocument } from '@/api/documents'
import type { EmitResult } from '@/api/invoices'

interface VoidDocumentDialogProps {
  open: boolean
  onClose: () => void
  documentId: string
  documentType: string
  issueDate: string
  onSuccess: (result: EmitResult) => void
}

function todayISO(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function VoidDocumentDialog({
  open,
  onClose,
  documentId,
  documentType,
  issueDate,
  onSuccess,
}: VoidDocumentDialogProps) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EmitResult | null>(null)

  const isValid = reason.trim().length >= 5

  const handleSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    setError(null)

    const [series, corrStr] = documentId.split('-')
    const correlative = parseInt(corrStr, 10)

    try {
      const res = await voidDocument({
        issueDate: todayISO(),
        referenceDate: issueDate,
        correlative: 1,
        items: [
          {
            series,
            correlative,
            documentType,
            reason: reason.trim(),
          },
        ],
      })
      setResult(res)
      onSuccess(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al anular documento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setReason('')
    setError(null)
    setResult(null)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Ban className="h-5 w-5 text-destructive" />
            Anular Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="font-medium">Comunicacion de baja enviada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Documento: <span className="font-mono">{result.documentId}</span>
                  </p>
                  {result.cdr?.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.cdr.description}
                    </p>
                  )}
                  {result.status === 'SENT' && (
                    <p className="text-sm text-amber-600 mt-2">
                      La anulacion es asincrona. Usa "Consultar Ticket" para verificar el estado.
                    </p>
                  )}
                </AlertDescription>
              </Alert>
              <div className="flex justify-end">
                <Button onClick={handleClose}>Cerrar</Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm text-muted-foreground">Documento a anular</Label>
                <p className="text-sm font-mono font-medium mt-1">{documentId}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="void-reason">
                  Motivo de anulacion <span className="text-destructive">*</span>
                </Label>
                <textarea
                  id="void-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ingrese el motivo de la anulacion (minimo 5 caracteres)"
                  rows={3}
                  disabled={isSubmitting}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
                {reason.length > 0 && reason.trim().length < 5 && (
                  <p className="text-xs text-destructive">El motivo debe tener al menos 5 caracteres</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Anulando...
                    </>
                  ) : (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Confirmar Anulacion
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
