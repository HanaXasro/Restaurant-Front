import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  ShoppingCart,
  UtensilsCrossed,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { ADMIN_USERNAME } from '@/lib/config'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  isActive: (path: string) => boolean
}

const NAV: NavItem[] = [
  { to: '/', label: 'داشبۆرد', icon: LayoutDashboard, isActive: (p) => p === '/' },
  { to: '/orders/new', label: 'فرۆشتنی نوێ', icon: ShoppingCart, isActive: (p) => p === '/orders/new' },
  {
    to: '/orders',
    label: 'داواکارییەکان',
    icon: ReceiptText,
    isActive: (p) => p.startsWith('/orders') && p !== '/orders/new',
  },
  { to: '/products', label: 'بەرهەمەکان', icon: UtensilsCrossed, isActive: (p) => p.startsWith('/products') },
  { to: '/expenses', label: 'خەرجییەکان', icon: Wallet, isActive: (p) => p.startsWith('/expenses') },
]

function SidebarContent() {
  const { pathname } = useLocation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((item) => {
          const active = item.isActive(pathname)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex h-12 items-center gap-3 rounded-lg px-4 text-base transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-foreground/80 hover:bg-accent',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="mb-2 px-2 text-sm text-muted-foreground">
          بەکارهێنەر: <span className="text-foreground">{ADMIN_USERNAME}</span>
        </div>
        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut />
          چوونەدەرەوە
        </Button>
      </div>
    </div>
  )
}

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // close the mobile menu when the page changes
  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar (appears on the right because the page is RTL) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e bg-card lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-3 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="مێنیو">
          <Menu className="h-5 w-5" />
        </Button>
        <Logo size={32} />
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-72 max-w-[85%] bg-card shadow-xl animate-in slide-in-from-right duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-3"
              onClick={() => setOpen(false)}
              aria-label="داخستن"
            >
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
