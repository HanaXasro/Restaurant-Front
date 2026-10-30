import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/** If the user is not logged in, any link goes directly to /login */
export function ProtectedRoute() {
  const { isAuth } = useAuth()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
