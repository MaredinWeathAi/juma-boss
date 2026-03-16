import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  ShoppingBag,
  Cake,
  Users,
  Package,
  Clock,
  Calculator,
  UserCheck,
  Building2,
  Store,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChefHat,
  Lock,
  Crown,
} from 'lucide-react'
import type { Tier } from '@/types'
import { useAuthStore } from '@/stores/authStore'

interface AppLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<any>
  minTier: Tier
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, minTier: 'hobby' },
  { path: '/orders', label: 'Orders', icon: ShoppingBag, minTier: 'hobby' },
  { path: '/products', label: 'Products', icon: Cake, minTier: 'hobby' },
  { path: '/customers', label: 'Customers', icon: Users, minTier: 'hobby' },
  { path: '/pricing', label: 'Pricing', icon: Calculator, minTier: 'hobby' },
  { path: '/inventory', label: 'Inventory', icon: Package, minTier: 'growing' },
  { path: '/production', label: 'Production', icon: Clock, minTier: 'growing' },
  { path: '/employees', label: 'Employees', icon: UserCheck, minTier: 'pro' },
  { path: '/wholesale', label: 'Wholesale', icon: Building2, minTier: 'pro' },
  { path: '/financial', label: 'Financial', icon: DollarSign, minTier: 'pro' },
  { path: '/marketplace', label: 'Marketplace', icon: Store, minTier: 'enterprise' },
  { path: '/settings', label: 'Settings', icon: Settings, minTier: 'hobby' },
]

const TIER_LEVEL: Record<Tier, number> = {
  hobby: 0,
  growing: 1,
  pro: 2,
  enterprise: 3,
}

const TIER_COLORS: Record<Tier, string> = {
  hobby: '#6B7280',
  growing: '#F59E0B',
  pro: '#F97316',
  enterprise: '#DC2626',
}

const TIER_LABELS: Record<Tier, string> = {
  hobby: 'Free',
  growing: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const hasAccess = (userTier: Tier | undefined, requiredTier: Tier): boolean => {
  if (!userTier) return false
  return (TIER_LEVEL[userTier] || 0) >= (TIER_LEVEL[requiredTier] || 0)
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 hover:bg-card rounded-lg"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-card border-r border-border transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 mb-2 text-xl font-bold hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-primary">
              <ChefHat size={24} className="text-background" />
            </div>
            <span>Juma Boss</span>
          </Link>

          {/* Tier badge */}
          {user?.tier && (
            <div
              className="text-xs px-3 py-1 rounded-full mb-6 font-medium"
              style={{
                backgroundColor: TIER_COLORS[user.tier as Tier] + '20',
                color: TIER_COLORS[user.tier as Tier],
              }}
            >
              {TIER_LABELS[user.tier as Tier]} Plan
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map(({ path, label, icon: Icon, minTier }) => {
              const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
              const hasFeatureAccess = hasAccess(user?.tier as Tier, minTier)

              if (hasFeatureAccess) {
                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary text-background font-medium'
                        : 'text-foreground hover:bg-card-hover'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                )
              }

              return (
                <button
                  key={path}
                  onClick={() => {
                    navigate('/upgrade')
                    setSidebarOpen(false)
                  }}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors opacity-50 text-foreground hover:opacity-75 w-full text-left"
                >
                  <Icon size={20} />
                  <span>{label}</span>
                  <Lock size={14} className="ml-auto" />
                </button>
              )
            })}
          </nav>

          {/* Upgrade button (if not enterprise) */}
          {user?.tier !== 'enterprise' && (
            <Link
              to="/upgrade"
              className="mb-4 flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              <Crown size={16} />
              <span>Upgrade Plan</span>
            </Link>
          )}

          {/* User info and logout */}
          <div className="border-t border-border pt-4">
            <div className="mb-4">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-foreground hover:bg-card-hover rounded-lg transition-colors text-sm"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 lg:p-8 pt-16 lg:pt-8">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
