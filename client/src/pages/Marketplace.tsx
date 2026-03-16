import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { Store, Star, MapPin, Cake } from 'lucide-react'
import type { MarketplaceListing } from '@/types'

export default function Marketplace() {
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await api.get('/marketplace')
        setListings(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchListings()
  }, [])

  const filteredListings = listings.filter(listing => {
    const matchesSearch =
      listing.bakerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || listing.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(listings.map(l => l.category))]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Marketplace"
        subtitle="Browse and connect with local bakers"
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search bakeries..."
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map(listing => (
            <div key={listing.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Baker Image */}
              <div className="h-48 bg-card-hover flex items-center justify-center">
                <Cake size={64} className="text-muted-foreground/50" />
              </div>

              {/* Baker Info */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{listing.bakerName}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={16}
                          className={i < Math.floor(listing.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">({listing.rating.toFixed(1)})</span>
                  </div>
                </div>

                {listing.bio && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {listing.bio}
                  </p>
                )}

                <div className="space-y-2 mb-4 pb-4 border-b border-border text-sm">
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium capitalize">{listing.category}</p>

                  {listing.serviceArea && (
                    <div className="mt-3 flex items-center gap-2">
                      <MapPin size={16} className="text-primary" />
                      <span className="text-xs">{listing.serviceArea}</span>
                    </div>
                  )}

                  {listing.deliveryAvailable && (
                    <p className="text-xs font-medium text-success mt-2">✓ Delivery Available</p>
                  )}
                </div>

                <button className="w-full btn-primary">
                  Browse Products
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="No bakeries found"
          description="Check back soon for local bakeries in your area."
        />
      )}
    </div>
  )
}
