import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Modal } from '@/components/shared/Modal'
import { formatCurrency, formatDateTime, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react'
import type { Order } from '@/types'

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState<Order['status']>('pending')
  const [newPaymentStatus, setNewPaymentStatus] = useState<Order['paymentStatus']>('pending')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${id}`)
        setOrder(response.data)
        setNewStatus(response.data.status)
        setNewPaymentStatus(response.data.paymentStatus)
      } catch (error) {
        handleApiError(error)
        navigate('/orders')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrder()
  }, [id, navigate])

  const handleStatusUpdate = async () => {
    if (!order) return

    setIsUpdating(true)
    try {
      const response = await api.put(`/orders/${id}`, {
        status: newStatus,
        paymentStatus: newPaymentStatus,
      })
      setOrder(response.data)
      setIsEditModalOpen(false)
      toast.success('Order updated successfully')
    } catch (error) {
      handleApiError(error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await api.delete(`/orders/${id}`)
        toast.success('Order deleted successfully')
        navigate('/orders')
      } catch (error) {
        handleApiError(error)
      }
    }
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!order) {
    return null
  }

  return (
    <div>
      <Header
        title={`Order ${order.orderNumber}`}
        actions={
          <button onClick={() => navigate('/orders')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{order.orderNumber}</h2>
                <p className="text-muted-foreground">Created on {formatDateTime(order.createdAt)}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Edit2 size={18} />
                Edit Status
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <StatusBadge status={order.status} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <StatusBadge status={order.paymentStatus} type="payment" />
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Items</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                    <div>
                      <p className="font-medium">Product {item.productId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-card-hover rounded-lg">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-card-hover rounded-lg">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg border-2 border-primary">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Information */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Type</p>
                <p className="font-medium capitalize">{order.deliveryType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                <p className="font-medium">{formatDate(order.deliveryDate)}</p>
              </div>
              {order.deliveryTime && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Delivery Time</p>
                  <p className="font-medium">{order.deliveryTime}</p>
                </div>
              )}
              {order.deliveryAddress && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Address</p>
                  <p className="font-medium">{order.deliveryAddress}</p>
                </div>
              )}
              {order.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Notes</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Customer</h3>
            <div className="p-4 bg-card-hover rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Customer ID</p>
              <p className="font-medium truncate">{order.customerId}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="card p-6">
            <button
              onClick={handleDeleteOrder}
              className="w-full px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              Delete Order
            </button>
          </div>
        </div>
      </div>

      {/* Edit Status Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Update Order Status"
        size="sm"
        actions={
          <>
            <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="btn-primary"
            >
              {isUpdating ? 'Updating...' : 'Update'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="label">Order Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as Order['status'])}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_production">In Production</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="label">Payment Status</label>
            <select
              value={newPaymentStatus}
              onChange={(e) => setNewPaymentStatus(e.target.value as Order['paymentStatus'])}
              className="input"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
