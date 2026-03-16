import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { Product, Customer } from '@/types'

interface OrderItemForm {
  productId: string
  quantity: number
  unitPrice: number
}

export default function OrderForm() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])

  const [formData, setFormData] = useState({
    customerId: '',
    items: [] as OrderItemForm[],
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: '',
    deliveryAddress: '',
    notes: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, customersRes] = await Promise.all([
          api.get('/products'),
          api.get('/customers'),
        ])
        setProducts(productsRes.data || [])
        setCustomers(customersRes.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddItem = () => {
    if (products.length > 0) {
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: products[0].id,
            quantity: 1,
            unitPrice: products[0].basePrice,
          },
        ],
      }))
    }
  }

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (
    index: number,
    field: keyof OrderItemForm,
    value: string | number
  ) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      if (field === 'productId') {
        const product = products.find(p => p.id === value)
        if (product) {
          newItems[index].productId = value as string
          newItems[index].unitPrice = product.basePrice
        }
      } else {
        ;(newItems[index] as any)[field] = value
      }
      return { ...prev, items: newItems }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.customerId || formData.items.length === 0) {
      toast.error('Please select a customer and add items')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/orders', {
        customerId: formData.customerId,
        items: formData.items,
        deliveryType: formData.deliveryType,
        deliveryDate: formData.deliveryDate,
        deliveryTime: formData.deliveryTime,
        deliveryAddress: formData.deliveryAddress,
        notes: formData.notes,
      })
      toast.success('Order created successfully')
      navigate('/orders')
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  const subtotal = formData.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  return (
    <div>
      <Header
        title="Create Order"
        actions={
          <button onClick={() => navigate('/orders')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="card p-6">
            <label className="label">Customer *</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              className="input"
              required
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </option>
              ))}
            </select>
          </div>

          {/* Items */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Order Items *</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-secondary btn-small flex items-center gap-2"
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>

            {formData.items.length > 0 ? (
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const product = products.find(p => p.id === item.productId)
                  return (
                    <div key={index} className="p-4 bg-card-hover rounded-lg space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="label text-xs">Product</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            className="input"
                          >
                            {products.map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label text-xs">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label text-xs">Unit Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))}
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Subtotal: {formatCurrency(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="btn-ghost btn-small text-danger flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No items added yet</p>
            )}
          </div>

          {/* Delivery Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-6">Delivery Information</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Delivery Type</label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value as 'delivery' | 'pickup' }))}
                  className="input"
                >
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Pickup</option>
                </select>
              </div>

              <div>
                <label className="label">Delivery Date *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">Delivery Time</label>
                <input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  className="input"
                />
              </div>

              {formData.deliveryType === 'delivery' && (
                <div>
                  <label className="label">Delivery Address</label>
                  <input
                    type="text"
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Special instructions..."
                  className="input resize-none"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6 space-y-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (10%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-primary"
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
