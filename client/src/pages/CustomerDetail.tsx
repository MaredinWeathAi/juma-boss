import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable, Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Edit2 } from 'lucide-react'
import type { Customer, Order } from '@/types'

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [spendingData, setSpendingData] = useState<Array<{ month: string; spent: number }>>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customerRes, ordersRes] = await Promise.all([
          api.get(`/customers/${id}`),
          api.get(`/customers/${id}/orders`),
        ])

        setCustomer(customerRes.data)
        setOrders(ordersRes.data || [])

        // Calculate spending by month
        const spending: Record<string, number> = {}
        ordersRes.data?.forEach((order: Order) => {
          const month = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
          })
          spending[month] = (spending[month] || 0) + order.total
        })
        setSpendingData(Object.entries(spending).map(([month, spent]) => ({ month, spent })))
      } catch (error) {
        handleApiError(error)
        navigate('/customers')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, navigate])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!customer) {
    return null
  }

  const orderColumns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
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
      key: 'createdAt',
      label: 'Date',
      render: (value) => formatDate(value),
    },
  ]

  return (
    <div>
      <Header
        title={customer.name}
        actions={
          <button onClick={() => navigate('/customers')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft size={18} />
            Back
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Customer Info */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Email</p>
              <p className="font-medium text-sm">{customer.email}</p>
            </div>
            {customer.phone && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="font-medium text-sm">{customer.phone}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="font-medium text-sm">{customer.address}</p>
              </div>
            )}
            {customer.city && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">City</p>
                <p className="font-medium text-sm">{customer.city}</p>
              </div>
            )}
            {customer.birthday && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Birthday</p>
                <p className="font-medium text-sm">{formatDate(customer.birthday)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Statistics</h3>
          <div className="space-y-4">
            <div className="p-3 bg-card-hover rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
              <p className="text-2xl font-bold">{customer.totalOrders}</p>
            </div>
            <div className="p-3 bg-card-hover rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(customer.totalSpent)}</p>
            </div>
            {customer.totalOrders > 0 && (
              <div className="p-3 bg-card-hover rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Average Order</p>
                <p className="text-lg font-bold">{formatCurrency(customer.totalSpent / customer.totalOrders)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Type */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Account Type</h3>
          <div className="p-4 bg-card-hover rounded-lg text-center">
            <p className={`text-lg font-semibold ${customer.isWholesale ? 'text-accent' : 'text-foreground'}`}>
              {customer.isWholesale ? 'Wholesale' : 'Retail'}
            </p>
          </div>
          {customer.notes && (
            <div className="mt-6">
              <p className="text-xs text-muted-foreground mb-2">Notes</p>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Spending Chart */}
      {spendingData.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Line type="monotone" dataKey="spent" stroke="#F97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Orders */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-6">Order History</h3>
        {orders.length > 0 ? (
          <DataTable columns={orderColumns} data={orders} keyField="id" />
        ) : (
          <p className="text-center text-muted-foreground py-8">No orders yet</p>
        )}
      </div>
    </div>
  )
}
