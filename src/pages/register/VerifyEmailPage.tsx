import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { verifyEmail, resendVerification } from '@/api/auth'

const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string })?.email || ''

  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true })
    }
  }, [email, navigate])

  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleCodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6)
    setCode(sanitized)
    if (codeError) setCodeError(null)
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setCodeError(null)

    if (!code.trim()) {
      setCodeError('El codigo de verificacion es obligatorio')
      return
    }
    if (code.length !== 6) {
      setCodeError('El codigo debe tener 6 digitos')
      return
    }

    setIsLoading(true)
    try {
      await verifyEmail({ email, code })
      navigate('/login', {
        replace: true,
        state: { verificationSuccess: true },
      })
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 400) {
        setApiError('Codigo incorrecto o expirado. Solicita uno nuevo.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError(error.message || 'Ocurrio un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [code, email, navigate])

  const handleResend = async () => {
    if (countdown > 0 || isResending) return
    setApiError(null)
    setResendSuccess(false)
    setIsResending(true)
    try {
      await resendVerification({ email })
      setCountdown(RESEND_COOLDOWN)
      setResendSuccess(true)
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 429) {
        setApiError('Demasiados intentos. Espera unos minutos antes de reenviar.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError(error.message || 'No se pudo reenviar el codigo. Intenta de nuevo.')
      }
    } finally {
      setIsResending(false)
    }
  }

  if (!email) return null

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand Panel (desktop only) */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-primary text-primary-foreground p-16">
        <img src="/logo-suit-icon.svg" alt="" className="h-16 w-16 mb-4 brightness-0 invert" />
        <h1 className="text-3xl font-bold mt-4">SUIT Portal</h1>
        <p className="text-lg opacity-80 mt-2">Facturacion Electronica</p>
        <p className="text-base opacity-70 mt-8 italic max-w-xs text-center">
          Emite tus comprobantes de forma simple y segura
        </p>
      </div>

      {/* Form Panel */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted lg:bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img src="/logo-suit-icon.svg" alt="" className="h-12 w-12" />
          <h1 className="text-xl font-bold text-primary mt-2">SUIT Portal</h1>
          <p className="text-sm text-muted-foreground">Facturacion Electronica</p>
        </div>

        <Card className="w-full max-w-[400px] mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Verifica tu correo</CardTitle>
            <CardDescription>
              Enviamos un codigo de 6 digitos a{' '}
              <span className="font-medium text-foreground">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} aria-label="Formulario de verificacion de correo">
              {apiError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              {resendSuccess && (
                <Alert className="mb-4">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Codigo reenviado exitosamente.</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className={codeError ? 'text-destructive' : ''}
                  >
                    Codigo de verificacion
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    className={`text-center text-lg tracking-widest ${codeError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    aria-invalid={codeError ? 'true' : undefined}
                    aria-describedby={codeError ? 'code-error' : undefined}
                    maxLength={6}
                  />
                  {codeError && (
                    <p id="code-error" className="text-sm text-destructive mt-1">
                      {codeError}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    'Verificar correo'
                  )}
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResend}
                    disabled={countdown > 0 || isResending}
                    className="text-sm"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Reenviando...
                      </>
                    ) : countdown > 0 ? (
                      `Reenviar codigo (${countdown}s)`
                    ) : (
                      'Reenviar codigo'
                    )}
                  </Button>
                </div>
              </div>
            </form>

            <p className="text-sm text-center mt-4 text-muted-foreground">
              <Link to="/login" className="text-primary hover:underline font-medium">
                Volver al inicio de sesion
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          &copy; 2026 SUIT - Powered by SUIT
        </p>
      </div>
    </div>
  )
}
