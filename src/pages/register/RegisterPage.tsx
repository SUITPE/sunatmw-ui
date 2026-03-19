import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { register } from '@/api/auth'

interface FormErrors {
  email?: string
  password?: string
  companyName?: string
  ruc?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [ruc, setRuc] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)

  const validate = (): FormErrors => {
    const errors: FormErrors = {}
    if (!email.trim()) {
      errors.email = 'El correo electronico es obligatorio'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Ingresa un correo electronico valido'
    }
    if (!password) {
      errors.password = 'La contrasena es obligatoria'
    } else if (password.length < 8) {
      errors.password = 'La contrasena debe tener al menos 8 caracteres'
    } else if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      errors.password = 'La contrasena debe incluir al menos 1 mayuscula y 1 numero'
    }
    if (!companyName.trim()) {
      errors.companyName = 'El nombre de la empresa es obligatorio'
    }
    if (!ruc.trim()) {
      errors.ruc = 'El RUC es obligatorio'
    } else if (!/^\d{11}$/.test(ruc.trim())) {
      errors.ruc = 'El RUC debe tener 11 digitos'
    }
    return errors
  }

  const handleFieldChange = (field: keyof FormErrors, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value)
        break
      case 'password':
        setPassword(value)
        break
      case 'companyName':
        setCompanyName(value)
        break
      case 'ruc':
        setRuc(value.replace(/\D/g, '').slice(0, 11))
        break
    }
    if (hasSubmitted) {
      const errs = validate()
      setFormErrors((prev) => ({ ...prev, [field]: errs[field] }))
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
      await register({
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        ruc: ruc.trim(),
      })
      navigate('/verify-email', { state: { email: email.trim() }, replace: true })
    } catch (err: unknown) {
      const error = err as Error & { status?: number }
      if (error.status === 409) {
        setApiError('Ya existe una cuenta con este correo o RUC. Intenta iniciar sesion.')
      } else if (error.message === 'Failed to fetch') {
        setApiError('No se pudo conectar al servidor. Verifica tu conexion a internet.')
      } else {
        setApiError(error.message || 'Ocurrio un error inesperado. Intenta de nuevo en unos minutos.')
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
            <CardTitle>Crea tu cuenta</CardTitle>
            <CardDescription>Registra tu empresa para empezar a facturar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} aria-label="Formulario de registro">
              {apiError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="companyName"
                    className={formErrors.companyName ? 'text-destructive' : ''}
                  >
                    Nombre de la empresa
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Mi Empresa S.A.C."
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    className={formErrors.companyName ? 'border-destructive focus-visible:ring-destructive' : ''}
                    aria-invalid={formErrors.companyName ? 'true' : undefined}
                    aria-describedby={formErrors.companyName ? 'companyName-error' : undefined}
                  />
                  {formErrors.companyName && (
                    <p id="companyName-error" className="text-sm text-destructive mt-1">
                      {formErrors.companyName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="ruc"
                    className={formErrors.ruc ? 'text-destructive' : ''}
                  >
                    RUC
                  </Label>
                  <Input
                    id="ruc"
                    type="text"
                    inputMode="numeric"
                    placeholder="20123456789"
                    autoComplete="off"
                    value={ruc}
                    onChange={(e) => handleFieldChange('ruc', e.target.value)}
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
                    onChange={(e) => handleFieldChange('email', e.target.value)}
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
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
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

                <Button type="submit" size="lg" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Crear cuenta'
                  )}
                </Button>
              </div>
            </form>

            <p className="text-sm text-center mt-4 text-muted-foreground">
              Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Inicia sesion
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-8">
          &copy; 2026 suit — Software que se adapta a ti
        </p>
      </div>
    </div>
  )
}
