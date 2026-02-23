import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Upload, Loader2, CheckCircle, Key, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { getTenantSettings, uploadCertificate, updateSunatCredentials } from '@/api/settings'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: getTenantSettings,
  })

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Configuracion</h1>
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Configuracion</h1>
      <p className="text-muted-foreground text-sm mb-6">Gestiona tu certificado digital y credenciales SUNAT</p>

      <div className="space-y-6 max-w-2xl">
        {/* Tenant Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Razon social</span>
              <span className="font-medium">{tenant?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">RUC</span>
              <span className="font-mono font-medium">{tenant?.ruc}</span>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Upload */}
        <CertificateCard
          hasCertificate={tenant?.hasCertificate ?? false}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })}
        />

        {/* SUNAT Credentials */}
        <SunatCredentialsCard
          currentSolUser={tenant?.solUser ?? ''}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })}
        />
      </div>
    </div>
  )
}

function CertificateCard({ hasCertificate, onSuccess }: { hasCertificate: boolean; onSuccess: () => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [certPassword, setCertPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Selecciona un archivo')
      const base64 = await fileToBase64(selectedFile)
      return uploadCertificate(base64, certPassword)
    },
    onSuccess: () => {
      setSuccess(true)
      setSelectedFile(null)
      setCertPassword('')
      setError(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onSuccess()
    },
    onError: (err: Error) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
        setError('Solo se aceptan archivos .pfx o .p12')
        setSelectedFile(null)
        return
      }
      setSelectedFile(file)
      setError(null)
      setSuccess(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShieldCheck className="h-5 w-5" />
          Certificado Digital
          {hasCertificate && (
            <span className="ml-auto text-xs font-normal bg-green-100 text-green-700 px-2 py-1 rounded-full">
              Configurado
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Certificado subido correctamente</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="cert-file">Archivo .pfx o .p12</Label>
          <Input
            ref={fileInputRef}
            id="cert-file"
            type="file"
            accept=".pfx,.p12"
            onChange={handleFileChange}
            disabled={mutation.isPending}
          />
          {selectedFile && (
            <p className="text-xs text-muted-foreground">Archivo: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cert-password">Contrasena del certificado</Label>
          <Input
            id="cert-password"
            type="password"
            placeholder="Ingresa la contrasena del .pfx"
            value={certPassword}
            onChange={(e) => setCertPassword(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={!selectedFile || !certPassword || mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Subiendo...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" />Subir Certificado</>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          El certificado se encripta antes de almacenarse. Puedes obtenerlo en{' '}
          <a
            href="https://www.gob.pe/26725-obtener-certificado-digital-tributario"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            gob.pe
          </a>
        </p>
      </CardContent>
    </Card>
  )
}

function SunatCredentialsCard({ currentSolUser, onSuccess }: { currentSolUser: string; onSuccess: () => void }) {
  const [solUser, setSolUser] = useState('')
  const [solPassword, setSolPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const mutation = useMutation({
    mutationFn: () => updateSunatCredentials(solUser, solPassword),
    onSuccess: () => {
      setSuccess(true)
      setSolUser('')
      setSolPassword('')
      setError(null)
      onSuccess()
    },
    onError: (err: Error) => {
      setError(err.message)
      setSuccess(false)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Key className="h-5 w-5" />
          Credenciales SOL (SUNAT)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">Credenciales actualizadas</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground">
          Usuario actual: <span className="font-mono font-medium">{currentSolUser || '(no configurado)'}</span>
        </p>

        <div className="space-y-2">
          <Label htmlFor="sol-user">Usuario SOL</Label>
          <Input
            id="sol-user"
            placeholder="Ej: MODDATOS"
            value={solUser}
            onChange={(e) => setSolUser(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sol-password">Clave SOL</Label>
          <Input
            id="sol-password"
            type="password"
            placeholder="Ingresa tu clave SOL"
            value={solPassword}
            onChange={(e) => setSolPassword(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={!solUser || !solPassword || mutation.isPending}
          variant="outline"
          className="w-full"
        >
          {mutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</>
          ) : (
            'Actualizar Credenciales SOL'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data:...;base64, prefix
      const base64 = result.split(',')[1] ?? result
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
