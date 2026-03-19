import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { adminLogin, getAdminDashboard } from '@/api/admin'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [masterKey, setMasterKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!masterKey.trim()) {
      setError('La Master Key es obligatoria')
      return
    }

    setIsLoading(true)
    try {
      // Temporarily set the key and test it
      adminLogin(masterKey.trim())
      await getAdminDashboard()
      navigate('/admin-abp/dashboard', { replace: true })
    } catch {
      localStorage.removeItem('admin_master_key')
      setError('Master Key invalida. Verifica e intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted">
      <div className="flex flex-col items-center mb-8">
        <div className="rounded-full bg-primary p-3 mb-3">
          <Shield className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-bold" style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, letterSpacing: '-2px' }}><span className="text-foreground">su</span><span className="text-primary">i</span><span className="text-foreground">t</span> <span className="text-foreground font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", letterSpacing: 'normal' }}>Admin</span></h1>
        <p className="text-sm text-muted-foreground">Acceso restringido - ABP Team</p>
      </div>

      <Card className="w-full max-w-[400px] mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Ingresa la Master Key para acceder al panel de administracion</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="masterKey">Master Key</Label>
                <div className="relative">
                  <Input
                    id="masterKey"
                    type={showKey ? 'text' : 'password'}
                    placeholder="Ingresa la master key"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    className="pr-10"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowKey(!showKey)}
                    aria-label={showKey ? 'Ocultar key' : 'Mostrar key'}
                  >
                    {showKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Acceder al Panel'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-8">
        &copy; 2026 suit Admin — ABP Team
      </p>
    </div>
  )
}
