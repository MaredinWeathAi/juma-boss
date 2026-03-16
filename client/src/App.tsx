import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import Orders from '@/pages/Orders'
import OrderDetail from '@/pages/OrderDetail'
import OrderForm from '@/pages/OrderForm'
import Products from '@/pages/Products'
import ProductForm from '@/pages/ProductForm'
import Customers from '@/pages/Customers'
import CustomerDetail from '@/pages/CustomerDetail'
import Inventory from '@/pages/Inventory'
import Production from '@/pages/Production'
import Pricing from '@/pages/Pricing'
import Employees from '@/pages/Employees'
import Wholesale from '@/pages/Wholesale'
import Marketplace from '@/pages/Marketplace'
import Financial from '@/pages/Financial'
import Settings from '@/pages/Settings'
import Storefront from '@/pages/Storefront'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout>{children}</AppLayout>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/store/:slug" element={<Storefront />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/new" element={<ProtectedRoute><OrderForm /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/products/new" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />

        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />

        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
        <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
        <Route path="/wholesale" element={<ProtectedRoute><Wholesale /></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
        <Route path="/financial" element={<ProtectedRoute><Financial /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
