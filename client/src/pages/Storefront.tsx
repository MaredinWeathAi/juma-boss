import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { Star, MapPin, Cake, ChefHat, ShoppingBag } from 'lucide-react'
import type { MarketplaceListing, Product } from '@/types'

export default function Storefront() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [listing, setListing] = useState<MarketplaceListing | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const [listingRes, productsRes] = await Promise.all([
          api.get(`/marketplace/${slug}`),
          api.get(`/marketplace/${slug}/products`),
        ])
        setListing(listingRes.data)
        setProducts(productsRes.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStorefront()
  }, [slug])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <EmptyState
          icon={Cake}
          title="Storefront not found"
          description="The bakery you're looking for doesn't exist."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <ChefHat size={24} className="text-background" />
            </div>
            <h1 className="text-xl font-bold">Juma Boss</h1>
          </div>
        </div>
      </header>

      {/* Baker Hero */}
      <section className="bg-gradient-to-br from-primary/20 via-accent/10 to-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{listing.bakerName}</h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={24}
                    className={i < Math.floor(listing.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold">{listing.rating.toFixed(1)} out of 5</span>
            </div>

            {/* Bio */}
            {listing.bio && (
              <p className="text-lg text-foreground/80 mb-6 max-w-xl">
                {listing.bio}
              </p>
            )}

            {/* Info */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                <span className="text-primary">📦</span>
                <span className="font-medium">{listing.products?.length || 0} Products</span>
              </div>

              {listing.serviceArea && (
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-lg border border-border">
                  <MapPin size={18} className="text-primary" />
                  <span className="font-medium">{listing.serviceArea}</span>
                </div>
              )}

              {listing.deliveryAvailable && (
                <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg border border-success/30">
                  <span>🚚</span>
                  <span className="font-medium">Delivery Available</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-12">Our Products</h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map(product => (
              <div key={product.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="h-56 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Cake size={80} className="text-primary/30" />
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{product.category}</p>

                    {product.description && (
                      <p className="text-sm text-foreground/80 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6 pb-6 border-b border-border text-sm">
                    {product.prepTime && (
                      <p className="text-muted-foreground">
                        ⏱️ Prep time: <span className="font-medium">{product.prepTime} minutes</span>
                      </p>
                    )}
                  </div>

                  {/* Price and CTA */}
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Price</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatCurrency(product.basePrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        // In a real app, this would navigate to a checkout flow
                        // For now, just show a message
                        alert(`Added ${product.name} to cart!`)
                      }}
                      className="btn-primary flex items-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Cake}
            title="No products available"
            description="This bakery hasn't added any products yet."
          />
        )}
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-muted-foreground">
          <p>
            {listing.bakerName} is powered by{' '}
            <span className="font-semibold text-foreground">Juma Boss</span> Bakery Management
            Platform
          </p>
          <p className="text-xs mt-2">© 2024 Juma Boss. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
