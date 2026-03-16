import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import type { User } from '@/types'

export default function Settings() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bakeryName: '',
    bio: '',
    storefrontSlug: '',
    storefrontDescription: '',
    notificationsEnabled: true,
    emailNotifications: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/settings')
        setFormData(response.data || {
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          bakeryName: user?.bakeryName || '',
          bio: user?.bio || '',
          storefrontSlug: '',
          storefrontDescription: '',
          notificationsEnabled: true,
          emailNotifications: true,
        })
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [user])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      await api.put('/settings', formData)
      toast.success('Settings saved successfully')
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header title="Settings" subtitle="Manage your bakery profile and preferences" />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Profile Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Profile Information</h3>

          <div className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input"
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="input"
                disabled
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="input"
              />
            </div>

            <div>
              <label className="label">Bakery Name</label>
              <input
                type="text"
                name="bakeryName"
                value={formData.bakeryName}
                onChange={handleChange}
                placeholder="Sweet Delights Bakery"
                className="input"
              />
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell customers about your bakery..."
                className="input resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Storefront Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Storefront</h3>

          <div className="space-y-4">
            <div>
              <label className="label">Storefront URL Slug</label>
              <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">bakery.jumaboss.com/</span>
                <input
                  type="text"
                  name="storefrontSlug"
                  value={formData.storefrontSlug}
                  onChange={handleChange}
                  placeholder="your-bakery-name"
                  className="input flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Create a unique URL for your public storefront
              </p>
            </div>

            <div>
              <label className="label">Storefront Description</label>
              <textarea
                name="storefrontDescription"
                value={formData.storefrontDescription}
                onChange={handleChange}
                placeholder="Describe what makes your bakery special..."
                className="input resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be shown on your public storefront page
              </p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Notifications</h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-card-hover rounded-lg cursor-pointer hover:bg-card-hover transition-colors">
              <input
                type="checkbox"
                name="notificationsEnabled"
                checked={formData.notificationsEnabled}
                onChange={handleChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get notified about orders, updates, and alerts
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-4 bg-card-hover rounded-lg cursor-pointer hover:bg-card-hover transition-colors">
              <input
                type="checkbox"
                name="emailNotifications"
                checked={formData.emailNotifications}
                onChange={handleChange}
                className="w-4 h-4 rounded cursor-pointer"
              />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receive important updates via email
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Account Tier */}
        {user && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Account Tier</h3>
            <div className="p-4 bg-card-hover rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
              <p className="text-2xl font-bold capitalize text-primary">{user.tier}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Upgrade your plan to unlock more features
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
