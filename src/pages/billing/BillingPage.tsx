import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CreditCard, ExternalLink, Loader2, AlertTriangle,
  CheckCircle, Crown, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { UsageBar } from '@/components/billing/UsageBar'
import { PricingCards } from '@/components/billing/PricingCards'
import {
  getBillingInfo,
  getUsage,
  createCheckoutSession,
  createPortalSession,
} from '@/api/billing'

const PLAN_DISPLAY: Record<string, { name: string; badge: string }> = {
  starter: { name: 'Starter', badge: 'Gratuito' },
  business: { name: 'Business', badge: 'Business' },
  pro: { name: 'Pro', badge: 'Pro' },
  enterprise: { name: 'Enterprise', badge: 'Enterprise' },
}

function formatSubscriptionStatus(status: string | null | undefined): {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  switch (status) {
    case 'active':
      return { label: 'Activa', variant: 'default' }
    case 'trialing':
      return { label: 'Periodo de prueba', variant: 'secondary' }
    case 'past_due':
      return { label: 'Pago pendiente', variant: 'destructive' }
    case 'canceled':
      return { label: 'Cancelada', variant: 'destructive' }
    case 'incomplete':
      return { label: 'Incompleta', variant: 'outline' }
    default:
      return { label: 'Sin suscripcion', variant: 'outline' }
  }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [successToast, setSuccessToast] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  // Detect checkout success/cancel from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessToast(true)
      setSearchParams({}, { replace: true })
      const timer = setTimeout(() => setSuccessToast(false), 6000)
      return () => clearTimeout(timer)
    }
    if (searchParams.get('canceled') === 'true') {
      setErrorMessage('El pago fue cancelado. Puedes intentar de nuevo cuando quieras.')
      setSearchParams({}, { replace: true })
      const timer = setTimeout(() => setErrorMessage(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [searchParams, setSearchParams])

  const {
    data: billing,
    isLoading: billingLoading,
    error: billingError,
  } = useQuery({
    queryKey: ['billing-info'],
    queryFn: getBillingInfo,
  })

  const {
    data: usage,
    isLoading: usageLoading,
    error: usageError,
  } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: getUsage,
  })

  const isLoading = billingLoading || usageLoading
  const hasError = billingError || usageError

  async function handleUpgrade(planId: string) {
    setCheckoutLoading(planId)
    setErrorMessage(null)
    try {
      const { url } = await createCheckoutSession(planId)
      window.location.href = url
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al iniciar el proceso de pago'
      )
      setCheckoutLoading(null)
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true)
    setErrorMessage(null)
    try {
      const { url } = await createPortalSession()
      window.location.href = url
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al abrir el portal de facturacion'
      )
      setPortalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Facturacion</h1>
        <p className="text-muted-foreground text-sm mb-6">Gestiona tu plan y suscripcion</p>
        <div className="space-y-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-80" />)}
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-2">Facturacion</h1>
        <p className="text-muted-foreground text-sm mb-6">Gestiona tu plan y suscripcion</p>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudo cargar la informacion de facturacion. Intenta recargar la pagina.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const currentPlan = billing?.plan?.toLowerCase() ?? 'starter'
  const planDisplay = (PLAN_DISPLAY[currentPlan] ?? PLAN_DISPLAY.starter)!
  const subscriptionStatus = formatSubscriptionStatus(billing?.subscription?.status)
  const isFreePlan = currentPlan === 'starter'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Facturacion</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestiona tu plan y suscripcion
          </p>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Tu suscripcion se ha actualizado correctamente. Los cambios pueden tardar unos
            segundos en reflejarse.
          </AlertDescription>
        </Alert>
      )}

      {/* Error message */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="h-5 w-5" />
              Plan actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold">{planDisplay.name}</span>
              <Badge variant={isFreePlan ? 'secondary' : 'default'}>
                {planDisplay.badge}
              </Badge>
            </div>
            {isFreePlan && (
              <p className="text-sm text-muted-foreground mt-2">
                Estas en el plan gratuito. Actualiza tu plan para obtener mas documentos y
                funcionalidades avanzadas.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Usage */}
        {usage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="h-5 w-5" />
                Uso del mes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UsageBar
                used={usage.documentCount}
                limit={usage.limit}
              />
              <p className="text-xs text-muted-foreground mt-3">
                Periodo: {usage.month}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Subscription Details (only for paid plans) */}
        {!isFreePlan && billing?.subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Suscripcion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={subscriptionStatus.variant} className="mt-1">
                    {subscriptionStatus.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Proximo cobro</p>
                  <p className="text-sm font-medium font-mono mt-1">
                    {formatDate(billing.nextBillingDate)}
                  </p>
                </div>
              </div>

              {billing.subscription.cancelAtPeriodEnd && (
                <Alert>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    Tu suscripcion se cancelara al final del periodo actual
                    ({formatDate(billing.subscription.currentPeriodEnd)}).
                  </AlertDescription>
                </Alert>
              )}

              {billing.subscription.status === 'past_due' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Tu ultimo pago fallo. Actualiza tu metodo de pago para evitar la
                    suspension del servicio.
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Abriendo portal...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Gestionar suscripcion
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Cambiar metodo de pago, descargar facturas o cancelar suscripcion
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div>
          <h2 className="text-xl font-semibold mb-1">Planes disponibles</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Elige el plan que mejor se adapte a tu negocio
          </p>
          <PricingCards
            currentPlan={currentPlan}
            onUpgrade={handleUpgrade}
            loading={checkoutLoading}
          />
        </div>
      </div>
    </div>
  )
}
