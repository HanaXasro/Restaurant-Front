import { createContext, useContext, useState, type ReactNode } from 'react'
import { ADMIN_PASSWORD, ADMIN_USERNAME } from './config'

const STORAGE_KEY = 'restaurant_admin_auth'

interface AuthContextValue {
  isAuth: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuth, setIsAuth] = useState<boolean>(() => localStorage.getItem(STORAGE_KEY) === '1')

  const login = (username: string, password: string) => {
    if (username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1')
      setIsAuth(true)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuth(false)
  }

  return <AuthContext.Provider value={{ isAuth, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
