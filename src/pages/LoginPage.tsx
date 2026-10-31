import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, LogIn, User } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

const DEFAULT_USERNAME = 'Admin'

export default function LoginPage() {
  const { isAuth, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  // already logged in -> go to the dashboard
  if (isAuth) return <Navigate to="/" replace />

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password) {
      setError('تکایە وشەی نهێنی بنووسە')
      return
    }
    if (login(DEFAULT_USERNAME, password)) {
      navigate(from === '/login' ? '/' : from, { replace: true })
    } else {
      setError('وشەی نهێنی هەڵەیە')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-background to-amber-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src="/logo.svg" alt="لۆگۆ" width={84} height={84} className="rounded-3xl shadow-lg" />
          <h1 className="text-3xl">سیستەمی شاورمەی پیکی پلایندەرس</h1>
          <p className="text-sm text-muted-foreground">بۆ بەردەوامبوون بچۆرە ژوورەوە</p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-6">
            {/* Admin heading, top center */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 ring-4 ring-orange-50">
                <User className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-wide" dir="ltr">
                {DEFAULT_USERNAME}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">وشەی نهێنی</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    autoFocus
                    className="px-9"
                    dir="ltr"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show ? 'شاردنەوەی وشەی نهێنی' : 'پیشاندانی وشەی نهێنی'}
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}

              <Button type="submit" size="lg" className="w-full">
                <LogIn />
                چوونەژوورەوە
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-center">
          <Logo size={28} className="opacity-60" />
        </div>
      </div>
    </div>
  )
}