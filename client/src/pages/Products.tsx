import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Cake, Eye, Trash2, ToggleRight, ToggleLeft } from 'lucide-react'
import type { Product } from '@/types'

export default function Products() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products')
        setProducts(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleToggleActive = async (product: Product) => {
    try {
      const response = await api.put(`/products/${product.id}`, {
        ...product,
        isActive: !product.isActive,
      })
      setProducts(products.map(p => p.id === product.id ? response.data : p))
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`)
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${productId}`)
      setProducts(products.filter(p => p.id !== productId))
      toast.success('Product deleted')
    } catch (error) {
      handleApiError(error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const categories = ['all', ...new Set(products.map(p => p.category))]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Products"
        subtitle={`${filteredProducts.length} product${filteredProducts.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => navigate('/products/new')} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Product
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search products..."
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

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              <div className="h-48 bg-card-hover flex items-center justify-center">
                <Cake size={64} className="text-muted-foreground/50" />
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>

                {product.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {product.description}
                  </p>
                )}

                <div className="mb-4 p-3 bg-card-hover rounded-lg">
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(product.basePrice)}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="p-2 bg-card-hover rounded text-center">
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-semibold">{formatCurrency(product.costPrice)}</p>
                  </div>
                  <div className="p-2 bg-card-hover rounded text-center">
                    <p className="text-muted-foreground">Prep Time</p>
                    <p className="font-semibold">{product.prepTime}m</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="flex-1 btn-secondary btn-small flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(product)}
                    className={`btn-small flex items-center justify-center gap-2 ${
                      product.isActive
                        ? 'bg-success/10 text-success hover:bg-success/20'
                        : 'bg-danger/10 text-danger hover:bg-danger/20'
                    }`}
                  >
                    {product.isActive ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="btn-small bg-danger/10 text-danger hover:bg-danger/20 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Cake}
          title="No products found"
          description="Start by creating your first product."
          action={{
            label: 'Create Product',
            onClick: () => navigate('/products/new'),
          }}
        />
      )}
    </div>
  )
}
