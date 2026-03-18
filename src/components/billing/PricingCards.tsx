import { Loader2, Check, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlanConfig {
  id: string
  name: string
  price: string
  priceNote: string
  docsPerMonth: string
  users: string
  features: string[]
  popular?: boolean
}

const PLANS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Gratis',
    priceNote: 'Para siempre',
    docsPerMonth: '50 docs/mes',
    users: '1 usuario',
    features: [
      'Facturas y boletas',
      'Notas de credito y debito',
      'Firma digital',
      'Validacion SUNAT',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 'S/79',
    priceNote: '/mes',
    docsPerMonth: '500 docs/mes',
    users: '5 usuarios',
    features: [
      'Todo en Starter',
      'Guias de remision',
      'Retenciones y percepciones',
      'Soporte prioritario',
      'Reportes avanzados',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'S/199',
    priceNote: '/mes',
    docsPerMonth: 'Ilimitado',
    users: 'Usuarios ilimitados',
    popular: true,
    features: [
      'Todo en Business',
      'Documentos ilimitados',
      'API access completo',
      'Webhooks',
      'Soporte 24/7',
      'SLA 99.9%',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'A convenir',
    priceNote: 'Contactar ventas',
    docsPerMonth: 'Ilimitado',
    users: 'Ilimitados',
    features: [
      'Todo en Pro',
      'Infraestructura dedicada',
      'Onboarding personalizado',
      'Account manager',
      'Integraciones custom',
      'Facturacion anual',
    ],
  },
]

const PLAN_ORDER: Record<string, number> = {
  starter: 0,
  business: 1,
  pro: 2,
  enterprise: 3,
}

interface PricingCardsProps {
  currentPlan: string
  onUpgrade: (planId: string) => void
  loading?: string | null
}

export function PricingCards({ currentPlan, onUpgrade, loading }: PricingCardsProps) {
  const currentPlanIndex = PLAN_ORDER[currentPlan.toLowerCase()] ?? 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan) => {
        const planIndex = PLAN_ORDER[plan.id] ?? 0
        const isCurrent = plan.id === currentPlan.toLowerCase()
        const isDowngrade = planIndex < currentPlanIndex
        const isUpgrade = planIndex > currentPlanIndex
        const isEnterprise = plan.id === 'enterprise'
        const isLoading = loading === plan.id

        return (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col',
              plan.popular && 'border-primary shadow-md',
              isCurrent && 'ring-2 ring-primary/50'
            )}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Mas popular
                </Badge>
              </div>
            )}

            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold font-mono tracking-tight">{plan.price}</span>
                {plan.priceNote && plan.price !== 'Gratis' && plan.price !== 'A convenir' && (
                  <span className="text-sm text-muted-foreground">{plan.priceNote}</span>
                )}
                {(plan.price === 'Gratis' || plan.price === 'A convenir') && (
                  <p className="text-xs text-muted-foreground mt-1">{plan.priceNote}</p>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{plan.docsPerMonth}</p>
                <p className="text-sm text-muted-foreground">{plan.users}</p>
              </div>

              <ul className="space-y-2 pt-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  Plan actual
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" className="w-full" disabled>
                  Plan actual es superior
                </Button>
              ) : isEnterprise ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open('mailto:ventas@suit.pe', '_blank')}
                >
                  Contactar ventas
                </Button>
              ) : isUpgrade ? (
                <Button
                  className="w-full"
                  onClick={() => onUpgrade(plan.id)}
                  disabled={!!loading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirigiendo...
                    </>
                  ) : (
                    `Upgrade a ${plan.name}`
                  )}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
