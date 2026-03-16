import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { SearchInput } from '@/components/shared/SearchInput'
import { toast } from 'sonner'
import { Package, AlertTriangle, Plus } from 'lucide-react'
import type { Ingredient } from '@/types'

export default function Inventory() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState<string>('')

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const response = await api.get('/ingredients')
        setIngredients(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIngredients()
  }, [])

  const handleUpdateStock = async (ingredientId: string, quantity: number) => {
    try {
      const ingredient = ingredients.find(i => i.id === ingredientId)
      if (!ingredient) return

      const response = await api.put(`/ingredients/${ingredientId}`, {
        ...ingredient,
        currentStock: quantity,
      })

      setIngredients(ingredients.map(i => i.id === ingredientId ? response.data : i))
      setEditingId(null)
      toast.success('Stock updated')
    } catch (error) {
      handleApiError(error)
    }
  }

  const getStockLevel = (current: number, minimum: number): 'critical' | 'low' | 'good' => {
    if (current <= minimum) return 'critical'
    if (current <= minimum * 1.5) return 'low'
    return 'good'
  }

  const getStockColor = (level: 'critical' | 'low' | 'good'): string => {
    switch (level) {
      case 'critical':
        return 'bg-danger/10 text-danger border-danger/30'
      case 'low':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'good':
        return 'bg-success/10 text-success border-success/30'
    }
  }

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || ingredient.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const lowStockItems = filteredIngredients.filter(
    i => getStockLevel(i.currentStock, i.minimumLevel) !== 'good'
  )

  const categories = ['all', ...new Set(ingredients.map(i => i.category))]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Inventory"
        subtitle={`${filteredIngredients.length} ingredient${filteredIngredients.length !== 1 ? 's' : ''}`}
      />

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card p-6 mb-6 border-l-4 border-warning">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-warning" />
            Low Stock Alert ({lowStockItems.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => {
              const level = getStockLevel(item.currentStock, item.minimumLevel)
              return (
                <div key={item.id} className={`p-3 rounded-lg border ${getStockColor(level)}`}>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs mt-1">
                    {item.currentStock} / {item.minimumLevel} {item.unit}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search ingredients..."
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

      {/* Inventory Table */}
      {filteredIngredients.length > 0 ? (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border hover:bg-card-hover transition-colors">
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Ingredient</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Current Stock</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Minimum Level</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Cost/Unit</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Total Value</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIngredients.map(ingredient => {
                const level = getStockLevel(ingredient.currentStock, ingredient.minimumLevel)
                const totalValue = ingredient.currentStock * ingredient.costPerUnit

                return (
                  <tr key={ingredient.id} className="border-b border-border hover:bg-card-hover transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <p className="font-medium">{ingredient.name}</p>
                      {ingredient.supplier && (
                        <p className="text-xs text-muted-foreground">{ingredient.supplier}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{ingredient.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getStockColor(level)}`}>
                        {ingredient.currentStock} {ingredient.unit}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{ingredient.minimumLevel} {ingredient.unit}</td>
                    <td className="px-6 py-4 text-sm font-medium">${ingredient.costPerUnit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm font-medium">${totalValue.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm">
                      {editingId === ingredient.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="input w-24"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateStock(ingredient.id, parseFloat(editQuantity))}
                            className="btn-primary btn-small"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-secondary btn-small"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(ingredient.id)
                            setEditQuantity(ingredient.currentStock.toString())
                          }}
                          className="btn-secondary btn-small"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Package size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-semibold mb-2">No ingredients found</p>
          <p className="text-muted-foreground">Create ingredients to manage your inventory.</p>
        </div>
      )}
    </div>
  )
}
