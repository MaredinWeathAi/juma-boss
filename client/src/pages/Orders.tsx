import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ShoppingBag } from 'lucide-react'
import type { Order } from '@/types'

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders')
        setOrders(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
      width: 'w-32',
    },
    {
      key: 'customerId',
      label: 'Customer',
      sortable: true,
      render: (value) => `Customer ${value.slice(0, 8)}`,
    },
    {
      key: 'items',
      label: 'Items',
      render: (items) => items.length,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value) => <StatusBadge status={value} type="payment" />,
    },
    {
      key: 'deliveryDate',
      label: 'Delivery Date',
      render: (value) => formatDate(value),
    },
  ]

  const statuses = ['all', 'pending', 'confirmed', 'in_production', 'ready', 'completed', 'cancelled']

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Orders"
        subtitle={`${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => navigate('/orders/new')} className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Order
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search orders..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Status' : status.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredOrders}
          keyField="id"
          onRowClick={(order) => navigate(`/orders/${order.id}`)}
        />
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="Start by creating a new order to manage your bakery sales."
          action={{
            label: 'Create Order',
            onClick: () => navigate('/orders/new'),
          }}
        />
      )}
    </div>
  )
}
