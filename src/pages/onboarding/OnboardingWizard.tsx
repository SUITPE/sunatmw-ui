import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft,
  Building2, ShieldCheck, UserPlus, PartyPopper, Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/auth.store'
import { useOnboarding } from '@/hooks/useOnboarding'
import { getClients, createClient } from '@/api/clients'
import type { CreateClientInput } from '@/api/clients'

const selectClassName = 'h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const TOTAL_STEPS = 5

const DOC_TYPES: Record<string, string> = {
  '6': 'RUC',
  '1': 'DNI',
}

interface StepIndicatorProps {
  currentStep: number
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { label: 'Bienvenida', number: 1 },
    { label: 'Negocio', number: 2 },
    { label: 'Certificado', number: 3 },
    { label: 'Cliente', number: 4 },
    { label: 'Listo', number: 5 },
  ]

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                step.number < currentStep
                  ? 'bg-green-600 text-white'
                  : step.number === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.number < currentStep ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-1 hidden sm:block">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-8 sm:w-12 h-0.5 mx-1 transition-colors ${
                step.number < currentStep ? 'bg-green-600' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------- Step 1: Bienvenida ------------------------------------------ */

function StepWelcome({ onNext, onSkipAll }: { onNext: () => void; onSkipAll: () => void }) {
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-primary/10 p-4">
          <Rocket className="h-12 w-12 text-primary" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-3">Bienvenido a SUNAT Middleware</h2>
      <p className="text-muted-foreground mb-2">
        Tu plataforma de facturacion electronica conectada directamente con SUNAT.
      </p>
      <p className="text-muted-foreground text-sm mb-8">
        Emite facturas, boletas, notas de credito y debito de forma rapida y segura.
        Te guiaremos en unos pasos simples para que comiences a operar.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button size="lg" onClick={onNext}>
          Comenzar <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onSkipAll} className="text-muted-foreground">
          Saltar todo
        </Button>
      </div>
    </div>
  )
}

/* ---------- Step 2: Datos del Negocio ----------------------------------- */

function StepBusinessData({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const user = useAuthStore((s) => s.user)
  const tenant = user?.tenant

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-blue-100 p-2">
          <Building2 className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Datos de tu Negocio</h2>
          <p className="text-sm text-muted-foreground">Verifica la informacion de tu empresa</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">Razon Social</Label>
            <p className="font-medium">{tenant?.name || 'No disponible'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs uppercase tracking-wide">RUC</Label>
            <p className="font-mono font-medium">{tenant?.ruc || 'No disponible'}</p>
          </div>
          <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
            Estos datos se configuraron al crear tu cuenta. Si necesitas modificarlos, contacta al administrador.
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Atras
        </Button>
        <Button onClick={onNext}>
          Siguiente <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Step 3: Certificado Digital --------------------------------- */

function StepCertificate({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  // For now, since we don't have a certificate status endpoint in the frontend API,
  // we show a general informational view. This can be enhanced when the API is available.
  const hasCertificate = false

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-amber-100 p-2">
          <ShieldCheck className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Certificado Digital</h2>
          <p className="text-sm text-muted-foreground">Necesario para firmar comprobantes</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            {hasCertificate ? (
              <>
                <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Certificado configurado</p>
                  <p className="text-sm text-muted-foreground">Tu certificado digital esta activo y listo para firmar.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800">Certificado pendiente</p>
                  <p className="text-sm text-muted-foreground">
                    Aun no se ha configurado un certificado digital (.pfx).
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="rounded-md bg-muted/50 border px-4 py-3 text-sm space-y-2">
            <p className="font-medium">Que es el certificado digital?</p>
            <p className="text-muted-foreground">
              El certificado digital (.pfx) es emitido por una entidad certificadora autorizada por SUNAT.
              Es necesario para firmar electronicamente tus comprobantes de pago.
            </p>
            <a
              href="https://www.sunat.gob.pe/ol-ti-itcertificadodigital/inscripcionCertificadoDigital.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm inline-block"
            >
              Ver documentacion de SUNAT sobre certificados digitales
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Atras
        </Button>
        <Button onClick={onNext}>
          Siguiente <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Step 4: Primer Cliente -------------------------------------- */

function StepFirstClient({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) {
  const queryClient = useQueryClient()
  const [documentType, setDocumentType] = useState('6')
  const [documentNumber, setDocumentNumber] = useState('')
  const [name, setName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [clientCreated, setClientCreated] = useState(false)

  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients', { page: 1, limit: 1 }],
    queryFn: () => getClients({ page: 1, limit: 1 }),
  })

  const totalClients = clientsData?.pagination?.total ?? 0
  const hasExistingClients = totalClients > 0

  const createMutation = useMutation({
    mutationFn: (input: CreateClientInput) => createClient(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      setClientCreated(true)
      setFormError(null)
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!documentNumber.trim()) {
      setFormError('El numero de documento es requerido')
      return
    }
    if (!name.trim()) {
      setFormError('El nombre es requerido')
      return
    }

    createMutation.mutate({
      documentType,
      documentNumber: documentNumber.trim(),
      name: name.trim(),
    })
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="rounded-full bg-purple-100 p-2">
          <UserPlus className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Primer Cliente</h2>
          <p className="text-sm text-muted-foreground">Registra un cliente para empezar a facturar</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {isLoadingClients ? (
            <div className="text-center py-4 text-sm text-muted-foreground">Verificando clientes...</div>
          ) : clientCreated ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <p className="font-medium text-green-800">Cliente creado exitosamente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Ya puedes usar este cliente al emitir documentos.
              </p>
            </div>
          ) : hasExistingClients ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <p className="font-medium">Ya tienes {totalClients} {totalClients === 1 ? 'cliente registrado' : 'clientes registrados'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Puedes continuar al siguiente paso.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="onb-doctype">Tipo de Documento</Label>
                <select
                  id="onb-doctype"
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
                <Label htmlFor="onb-docnumber">Numero de Documento</Label>
                <Input
                  id="onb-docnumber"
                  placeholder={documentType === '6' ? '20XXXXXXXXX' : 'Numero de documento'}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="onb-name">Nombre / Razon Social</Label>
                <Input
                  id="onb-name"
                  placeholder="Nombre completo o razon social"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creando...' : 'Crear Cliente'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Atras
        </Button>
        <Button onClick={onNext}>
          {hasExistingClients || clientCreated ? 'Siguiente' : 'Saltar'} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

/* ---------- Step 5: Completado ------------------------------------------ */

function StepComplete({ onFinish }: { onFinish: () => void }) {
  const user = useAuthStore((s) => s.user)

  const completionItems = [
    { label: 'Cuenta creada', completed: true },
    { label: 'Datos del negocio verificados', completed: !!user?.tenant?.name },
    { label: 'Certificado digital revisado', completed: true },
    { label: 'Clientes configurados', completed: true },
  ]

  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="rounded-full bg-green-100 p-4">
          <PartyPopper className="h-12 w-12 text-green-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-3">Todo listo!</h2>
      <p className="text-muted-foreground mb-6">
        Has completado la configuracion inicial. Ya puedes comenzar a emitir comprobantes electronicos.
      </p>

      <Card className="text-left mb-6">
        <CardContent className="p-6 space-y-3">
          {completionItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${item.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
              <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
              {item.completed && <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 ml-auto">Listo</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Button size="lg" onClick={onFinish}>
        Ir al Dashboard <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}

/* ---------- Main Wizard Component --------------------------------------- */

export default function OnboardingWizard() {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { completeOnboarding } = useOnboarding()

  const handleFinish = () => {
    completeOnboarding()
    navigate('/dashboard', { replace: true })
  }

  const handleSkipAll = () => {
    completeOnboarding()
    navigate('/dashboard', { replace: true })
  }

  const goNext = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
          <StepIndicator currentStep={step} />

          {step === 1 && <StepWelcome onNext={goNext} onSkipAll={handleSkipAll} />}
          {step === 2 && <StepBusinessData onNext={goNext} onBack={goBack} />}
          {step === 3 && <StepCertificate onNext={goNext} onBack={goBack} />}
          {step === 4 && <StepFirstClient onNext={goNext} onBack={goBack} />}
          {step === 5 && <StepComplete onFinish={handleFinish} />}
        </div>
      </div>
    </div>
  )
}
