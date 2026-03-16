import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users, Plus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

interface ClientCard {
  id: string
  name: string
  email: string
  bakeryName: string
  tier: string
  phone?: string
  bio?: string
  createdAt: string
  stats: {
    totalOrders: number
    totalRevenue: number
    totalProducts: number
    totalCustomers: number
    totalEmployees: number
  }
}

const TIER_COLORS: Record<string, string> = {
  hobby: 'bg-gray-100 text-gray-800',
  growing: 'bg-amber-100 text-amber-800',
  pro: 'bg-orange-100 text-orange-800',
  enterprise: 'bg-red-100 text-red-800',
}

const TIER_LABELS: Record<string, string> = {
  hobby: 'Free',
  growing: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

interface ClientFormData {
  name: string
  email: string
  bakeryName: string
  password: string
  tier: string
  phone: string
}

const emptyFormData: ClientFormData = {
  name: '',
  email: '',
  bakeryName: '',
  password: '',
  tier: 'hobby',
  phone: '',
}

export default function AdminClients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientCard | null>(null)
  const [formData, setFormData] = useState<ClientFormData>(emptyFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      const response = await api.get('/admin/clients')
      // API returns array directly, not { data: [...] }
      const data = Array.isArray(response) ? response : (response.data || response.clients || [])
      setClients(data)
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleOpenCreate = () => {
    setEditingClient(null)
    setFormData(emptyFormData)
    setShowForm(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, client: ClientCard) => {
    e.stopPropagation()
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      bakeryName: client.bakeryName,
      password: '',
      tier: client.tier,
      phone: client.phone || '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingClient(null)
    setFormData(emptyFormData)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.bakeryName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!editingClient && !formData.password) {
      toast.error('Password is required for new clients')
      return
    }

    setIsSaving(true)
    try {
      if (editingClient) {
        await api.put(`/admin/clients/${editingClient.id}`, formData)
        toast.success('Client updated successfully')
      } else {
        await api.post('/admin/clients', formData)
        toast.success('Client created successfully')
      }
      handleCloseForm()
      setIsLoading(true)
      await fetchClients()
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation()
    if (deleteConfirm !== clientId) {
      setDeleteConfirm(clientId)
      return
    }

    try {
      await api.delete(`/admin/clients/${clientId}`)
      toast.success('Client deleted successfully')
      setDeleteConfirm(null)
      setClients(clients.filter(c => c.id !== clientId))
    } catch (error) {
      handleApiError(error)
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.bakeryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTier = !selectedTier || client.tier === selectedTier

    return matchesSearch && matchesTier
  })

  const tiers = ['hobby', 'growing', 'pro', 'enterprise']

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Clients"
        subtitle={`${filteredClients.length} baker${filteredClients.length !== 1 ? 's' : ''}`}
      />

      {/* Actions */}
      <div className="mb-6">
        <button
          onClick={handleOpenCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add New Client
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6 space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name, bakery, or email..."
        />

        <div>
          <label className="text-sm font-medium text-foreground block mb-2">Filter by Tier</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTier('')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !selectedTier ? 'bg-primary text-background' : 'bg-card-hover text-foreground hover:bg-card-hover/80'
              }`}
            >
              All
            </button>
            {tiers.map(tier => (
              <button
                key={tier}
                onClick={() => setSelectedTier(selectedTier === tier ? '' : tier)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                  selectedTier === tier ? 'bg-primary text-background' : 'bg-card-hover text-foreground hover:bg-card-hover/80'
                }`}
              >
                {TIER_LABELS[tier] || tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
              className="card p-6 hover:bg-card-hover cursor-pointer transition-colors relative group"
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleOpenEdit(e, client)}
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title="Edit client"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={(e) => handleDelete(e, client.id)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    deleteConfirm === client.id
                      ? 'bg-red-500 text-white'
                      : 'hover:bg-red-50 text-red-500'
                  }`}
                  title={deleteConfirm === client.id ? 'Click again to confirm' : 'Delete client'}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex items-start justify-between mb-4 pr-16">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.bakeryName}</p>
                  <p className="text-xs text-muted-foreground">{client.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${TIER_COLORS[client.tier] || 'bg-gray-100 text-gray-800'}`}>
                  {TIER_LABELS[client.tier] || client.tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-lg font-semibold">{client.stats?.totalOrders ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold">{formatCurrency(client.stats?.totalRevenue ?? 0)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-semibold">{client.stats?.totalProducts ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-lg font-semibold">{client.stats?.totalCustomers ?? 0}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Member since {formatDate(client.createdAt)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No clients found"
          description={searchTerm || selectedTier ? 'No bakers match your search criteria.' : 'No bakers have signed up yet. Add your first client!'}
          action={!searchTerm && !selectedTier ? { label: 'Add Client', onClick: handleOpenCreate } : undefined}
        />
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold">
                {editingClient ? 'Edit Client' : 'Add New Client'}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-card-hover rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Baker's full name"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="baker@example.com"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Bakery Name *</label>
                <input
                  type="text"
                  value={formData.bakeryName}
                  onChange={(e) => setFormData({ ...formData, bakeryName: e.target.value })}
                  placeholder="Name of their bakery"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">
                  Password {editingClient ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingClient ? '••••••••' : 'Set password'}
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone number"
                  className="input"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  className="input"
                >
                  <option value="hobby">Free (Hobby)</option>
                  <option value="growing">Starter (Growing)</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border">
              <button
                onClick={handleCloseForm}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
