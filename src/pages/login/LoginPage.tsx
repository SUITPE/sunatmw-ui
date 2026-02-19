import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthStore } from '@/stores/auth.store'
import { login as apiLogin } from '@/api/auth'

interface FormErrors {
  ruc?: string
  email?: string
  password?: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)

  const [ruc, setRuc] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)

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
    if (!password) {
      errors.password = 'La contrasena es obligatoria'
    } else if (password.length < 8) {
      errors.password = 'La contrasena debe tener al menos 8 caracteres'
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

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, password: errs.password }))
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
      const response = await apiLogin({ ruc: ruc.trim(), email: email.trim(), password })
      storeLogin(response.accessToken, response.refreshToken, response.user)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 401) {
        setApiError('Correo electronico o contrasena incorrectos. Verifica tus datos e intenta de nuevo.')
      } else if (error.status === 403) {
        setApiError('Tu cuenta ha sido desactivada. Contacta al administrador de tu empresa.')
      } else if (error.status === 429) {
        setApiError('Demasiados intentos fallidos. Espera unos minutos antes de intentar de nuevo.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError('Ocurrio un error inesperado. Intenta de nuevo en unos minutos.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    setApiError(null)
    alert('Contacta al administrador de tu empresa para restablecer tu contrasena.')
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Brand Panel (desktop only) */}
      <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center bg-primary text-primary-foreground p-16">
        <FileText className="h-16 w-16 mb-4" />
        <h1 className="text-3xl font-bold mt-4">sunatmw</h1>
        <p className="text-lg opacity-80 mt-2">Facturacion Electronica</p>
        <p className="text-base opacity-70 mt-8 italic max-w-xs text-center">
          Emite tus comprobantes de forma simple y segura
        </p>
      </div>

      {/* Form Panel */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted lg:bg-background">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <FileText className="h-12 w-12 text-primary" />
          <h1 className="text-xl font-bold text-primary mt-2">sunatmw</h1>
          <p className="text-sm text-muted-foreground">Facturacion Electronica</p>
        </div>

        <Card className="w-full max-w-[400px] mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Inicia sesion</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} aria-label="Formulario de inicio de sesion">
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

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={formErrors.password ? 'text-destructive' : ''}
                  >
                    Contrasena
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      autoComplete="current-password"
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
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-primary hover:underline cursor-pointer"
                  >
                    Olvide mi contrasena
                  </button>
                </div>

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Iniciando sesion...
                    </>
                  ) : (
                    'Iniciar sesion'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          &copy; 2026 sunatmw - Facturacion Electronica
        </p>
      </div>
    </div>
  )
}
