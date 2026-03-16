import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

interface ClientCard {
  id: string
  name: string
  bakeryName: string
  tier: string
  totalOrders: number
  totalRevenue: number
  productCount: number
  customerCount: number
  createdAt: string
}

const TIER_COLORS: Record<string, string> = {
  hobby: 'bg-gray-100 text-gray-800',
  growing: 'bg-amber-100 text-amber-800',
  pro: 'bg-orange-100 text-orange-800',
  enterprise: 'bg-red-100 text-red-800',
}

export default function AdminClients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('')

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/admin/clients')
        setClients(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.bakeryName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTier = !selectedTier || client.tier === selectedTier

    return matchesSearch && matchesTier
  })

  const tiers = Array.from(new Set(clients.map(c => c.tier)))

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Clients"
        subtitle={`${filteredClients.length} baker${filteredClients.length !== 1 ? 's' : ''}`}
      />

      {/* Filters */}
      <div className="card p-6 mb-6 space-y-4">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by name or bakery..."
        />

        {tiers.length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Filter by Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full md:w-48 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Tiers</option>
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clients Grid */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
              className="card p-6 hover:bg-card-hover cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{client.name}</h3>
                  <p className="text-sm text-muted-foreground">{client.bakeryName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${TIER_COLORS[client.tier] || 'bg-gray-100 text-gray-800'}`}>
                  {client.tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-lg font-semibold">{client.totalOrders}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                  <p className="text-lg font-semibold">{formatCurrency(client.totalRevenue)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-lg font-semibold">{client.productCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customers</p>
                  <p className="text-lg font-semibold">{client.customerCount}</p>
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
          description="No bakers match your search criteria."
        />
      )}
    </div>
  )
}
