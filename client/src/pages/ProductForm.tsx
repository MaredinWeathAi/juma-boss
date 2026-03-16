import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { Product, Ingredient } from '@/types'

interface ProductFormState {
  name: string
  description: string
  category: string
  basePrice: string
  costPrice: string
  prepTime: string
  ingredients: Array<{
    ingredientId: string
    quantity: string
    unit: string
  }>
}

export default function ProductForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(id ? true : false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormState>({
    name: '',
    description: '',
    category: '',
    basePrice: '',
    costPrice: '',
    prepTime: '',
    ingredients: [],
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ingredientsRes = await api.get('/ingredients')
        setIngredients(ingredientsRes.data || [])

        if (id) {
          const productRes = await api.get(`/products/${id}`)
          const productData = productRes.data
          setProduct(productData)
          setFormData({
            name: productData.name,
            description: productData.description || '',
            category: productData.category,
            basePrice: productData.basePrice.toString(),
            costPrice: productData.costPrice.toString(),
            prepTime: productData.prepTime.toString(),
            ingredients: productData.ingredients || [],
          })
        }
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAddIngredient = () => {
    if (ingredients.length > 0) {
      setFormData(prev => ({
        ...prev,
        ingredients: [
          ...prev.ingredients,
          {
            ingredientId: ingredients[0].id,
            quantity: '',
            unit: ingredients[0].unit,
          },
        ],
      }))
    }
  }

  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }

  const handleIngredientChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData(prev => {
      const newIngredients = [...prev.ingredients]
      if (field === 'ingredientId') {
        const ingredient = ingredients.find(i => i.id === value)
        if (ingredient) {
          newIngredients[index].ingredientId = value
          newIngredients[index].unit = ingredient.unit
        }
      } else {
        newIngredients[index][field as 'quantity' | 'unit'] = value
      }
      return { ...prev, ingredients: newIngredients }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.category || !formData.basePrice) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        basePrice: parseFloat(formData.basePrice),
        costPrice: parseFloat(formData.costPrice),
        prepTime: parseInt(formData.prepTime) || 0,
        ingredients: formData.ingredients,
      }

      if (id) {
        await api.put(`/products/${id}`, data)
        toast.success('Product updated successfully')
      } else {
        await api.post('/products', data)
        toast.success('Product created successfully')
      }

      navigate('/products')
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title={id ? `Edit Product` : 'Create Product'}
        actions={
          <button onClick={() => navigate('/products')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6">Basic Information</h3>

            <div className="space-y-4">
              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Chocolate Cake"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your product..."
                  className="input resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category *</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Cake, Bread"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="label">Prep Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, prepTime: e.target.value }))}
                    placeholder="60"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6">Pricing</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Cost Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  placeholder="10.00"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Base Price ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.basePrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                  placeholder="25.00"
                  className="input"
                  required
                />
              </div>
            </div>

            {formData.costPrice && formData.basePrice && (
              <div className="mt-4 p-4 bg-card-hover rounded-lg">
                <p className="text-sm text-muted-foreground">Margin</p>
                <p className="text-2xl font-bold text-success">
                  {(((parseFloat(formData.basePrice) - parseFloat(formData.costPrice)) / parseFloat(formData.basePrice)) * 100).toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Ingredients</h3>
              <button
                type="button"
                onClick={handleAddIngredient}
                className="btn-secondary btn-small flex items-center gap-2"
              >
                <Plus size={16} />
                Add Ingredient
              </button>
            </div>

            {formData.ingredients.length > 0 ? (
              <div className="space-y-4">
                {formData.ingredients.map((item, index) => (
                  <div key={index} className="p-4 bg-card-hover rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="label text-xs">Ingredient</label>
                        <select
                          value={item.ingredientId}
                          onChange={(e) => handleIngredientChange(index, 'ingredientId', e.target.value)}
                          className="input"
                        >
                          <option value="">Select ingredient</option>
                          {ingredients.map(ingredient => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Quantity</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                          placeholder="1"
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                          placeholder="kg, g, ml"
                          className="input"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(index)}
                      className="btn-ghost btn-small text-danger flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No ingredients added yet</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary"
            >
              {isSubmitting ? 'Saving...' : id ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
