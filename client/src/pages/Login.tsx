import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { handleApiError } from '@/lib/api'
import { toast } from 'sonner'
import { ChefHat } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (error) {
      handleApiError(error, 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary">
              <ChefHat size={32} className="text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Juma Boss</h1>
              <p className="text-xs text-muted-foreground">Bakery Management Platform</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="card p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Welcome Back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-2">Don't have an account?</p>
          <Link to="/register" className="text-primary hover:text-primary-hover font-medium">
            Create one now
          </Link>
        </div>
      </div>
    </div>
  )
}
