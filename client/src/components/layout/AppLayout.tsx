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
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface AppLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/products', label: 'Products', icon: Cake },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/inventory', label: 'Inventory', icon: Package },
  { path: '/production', label: 'Production', icon: Clock },
  { path: '/pricing', label: 'Pricing', icon: Calculator },
  { path: '/employees', label: 'Employees', icon: UserCheck },
  { path: '/wholesale', label: 'Wholesale', icon: Building2 },
  { path: '/marketplace', label: 'Marketplace', icon: Store },
  { path: '/financial', label: 'Financial', icon: DollarSign },
  { path: '/settings', label: 'Settings', icon: Settings },
]

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
            className="flex items-center gap-2 mb-8 text-xl font-bold hover:opacity-80 transition-opacity"
          >
            <div className="p-2 rounded-lg bg-primary">
              <ChefHat size={24} className="text-background" />
            </div>
            <span>Juma Boss</span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path || location.pathname.startsWith(path + '/')
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
            })}
          </nav>

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
