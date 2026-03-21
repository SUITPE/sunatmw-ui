import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { forgotPassword } from '@/api/auth'

interface FormErrors {
  ruc?: string
  email?: string
}

export default function ForgotPasswordPage() {
  const [ruc, setRuc] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = (): FormErrors => {
    const errors: FormErrors = {}
    if (!ruc.trim()) {
      errors.ruc = 'El RUC es obligatorio'
    } else if (!/^\d{11}$/.test(ruc.trim())) {
      errors.ruc = 'El RUC debe tener 11 digitos'
    }
    if (!email.trim()) {
      errors.email = 'El correo electronico es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electronico valido'
    }
    return errors
  }

  const handleRucChange = (value: string) => {
    setRuc(value.replace(/\D/g, '').slice(0, 11))
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, ruc: errs.ruc }))
    }
  }

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, email: errs.email }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setHasSubmitted(true)
    setApiError(null)

    const errors = validate()
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsLoading(true)
    try {
      await forgotPassword({ email: email.trim(), ruc: ruc.trim() })
      setSuccess(true)
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 429) {
        setApiError('Demasiados intentos. Espera unos minutos antes de intentar de nuevo.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError(error.message || 'Ocurrio un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand Panel (desktop only) */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center p-16" style={{ background: '#0A0F1C' }}>
        <span className="text-7xl font-bold" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: '-2px' }}><span style={{ color: '#FFFFFF' }}>su</span><span style={{ color: '#2563EB' }}>i</span><span style={{ color: '#FFFFFF' }}>t</span></span>
        <p className="text-lg mt-4" style={{ fontFamily: "'DM Sans', sans-serif", color: '#60A5FA' }}>
          Software que se adapta a ti
        </p>
      </div>

      {/* Form Panel */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted lg:bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img src="/favicon.svg" alt="" className="h-12 w-12" />
          <h1 className="text-2xl font-bold mt-2" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: '-2px' }}><span className="text-foreground">su</span><span className="text-primary">i</span><span className="text-foreground">t</span></h1>
          <p className="text-sm text-muted-foreground">Software que se adapta a ti</p>
        </div>

        <Card className="w-full max-w-[400px] mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Restablecer contrasena</CardTitle>
            <CardDescription>
              {success
                ? 'Revisa tu correo electronico'
                : 'Ingresa tus datos para recibir un enlace de restablecimiento'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Si el correo esta registrado, recibiras un enlace para restablecer tu contrasena. Revisa tu bandeja de entrada y spam.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-center text-muted-foreground">
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Volver al inicio de sesion
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-label="Formulario de restablecimiento de contrasena">
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ruc"
                      className={formErrors.ruc ? 'text-destructive' : ''}
                    >
                      RUC de la empresa
                    </Label>
                    <Input
                      id="ruc"
                      type="text"
                      inputMode="numeric"
                      placeholder="20123456789"
                      autoComplete="organization"
                      value={ruc}
                      onChange={(e) => handleRucChange(e.target.value)}
                      className={formErrors.ruc ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={formErrors.ruc ? 'true' : undefined}
                      aria-describedby={formErrors.ruc ? 'ruc-error' : undefined}
                    />
                    {formErrors.ruc && (
                      <p id="ruc-error" className="text-sm text-destructive mt-1">
                        {formErrors.ruc}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={formErrors.email ? 'text-destructive' : ''}
                    >
                      Correo electronico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@empresa.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={formErrors.email ? 'true' : undefined}
                      aria-describedby={formErrors.email ? 'email-error' : undefined}
                    />
                    {formErrors.email && (
                      <p id="email-error" className="text-sm text-destructive mt-1">
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar enlace de restablecimiento'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {!success && (
              <p className="text-sm text-center mt-4 text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Volver al inicio de sesion
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          &copy; 2026 suit — Software que se adapta a ti
        </p>
      </div>
    </div>
  )
}
