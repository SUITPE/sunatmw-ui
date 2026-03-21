import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { resetPassword } from '@/api/auth'

interface FormErrors {
  password?: string
  confirmPassword?: string
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const validate = (): FormErrors => {
    const errors: FormErrors = {}
    if (!password) {
      errors.password = 'La contrasena es obligatoria'
    } else if (password.length < 8) {
      errors.password = 'La contrasena debe tener al menos 8 caracteres'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'La contrasena debe tener al menos 1 mayuscula'
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'La contrasena debe tener al menos 1 numero'
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirma tu contrasena'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Las contrasenas no coinciden'
    }
    return errors
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, password: errs.password }))
    }
  }

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value)
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, confirmPassword: errs.confirmPassword }))
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
      await resetPassword({ token, newPassword: password })
      setSuccess(true)
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 400) {
        setApiError(error.message || 'El enlace es invalido o ha expirado. Solicita uno nuevo.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError(error.message || 'Ocurrio un error inesperado. Intenta de nuevo.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted">
        <Card className="w-full max-w-[400px] mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Enlace invalido</CardTitle>
            <CardDescription>Este enlace de restablecimiento no es valido.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Solicitar un nuevo enlace
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
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
            <CardTitle>Nueva contrasena</CardTitle>
            <CardDescription>
              {success
                ? 'Tu contrasena fue actualizada'
                : 'Ingresa tu nueva contrasena'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Tu contrasena fue actualizada exitosamente. Ya puedes iniciar sesion.
                  </AlertDescription>
                </Alert>
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Ir a iniciar sesion
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} aria-label="Formulario de nueva contrasena">
                {apiError && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className={formErrors.password ? 'text-destructive' : ''}
                    >
                      Nueva contrasena
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className={`pr-10 ${formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                        aria-invalid={formErrors.password ? 'true' : undefined}
                        aria-describedby={formErrors.password ? 'password-error' : undefined}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {formErrors.password && (
                      <p id="password-error" className="text-sm text-destructive mt-1">
                        {formErrors.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Minimo 8 caracteres, 1 mayuscula y 1 numero
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className={formErrors.confirmPassword ? 'text-destructive' : ''}
                    >
                      Confirmar contrasena
                    </Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      className={formErrors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}
                      aria-invalid={formErrors.confirmPassword ? 'true' : undefined}
                      aria-describedby={formErrors.confirmPassword ? 'confirm-error' : undefined}
                    />
                    {formErrors.confirmPassword && (
                      <p id="confirm-error" className="text-sm text-destructive mt-1">
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar contrasena'
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
