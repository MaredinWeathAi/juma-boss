import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable, Column } from '@/components/shared/DataTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, DollarSign, ShoppingCart, Users, Package, Briefcase, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface RecentOrder {
  id: string
  customerName: string
  totalAmount: number
  status: string
  paymentStatus: string
  createdAt: string
}

interface ProductItem {
  id: string
  name: string
  category: string
  basePrice: number
  costPrice: number
  isActive: boolean
}

interface TopCustomer {
  id: string
  name: string
  email: string
  totalOrders: number
  totalSpent: number
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#F59E0B',
  confirmed: '#3B82F6',
  in_production: '#8B5CF6',
  ready: '#10B981',
  completed: '#6B7280',
  cancelled: '#EF4444',
}

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Single endpoint returns everything
        const response = await api.get(`/admin/clients/${id}`)
        setData(response)
        setSelectedTier(response.tier || '')
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchClientData()
    }
  }, [id])

  const handleTierChange = async (newTier: string) => {
    try {
      await api.put(`/admin/clients/${id}/tier`, { tier: newTier })
      setSelectedTier(newTier)
      if (data) {
        setData({ ...data, tier: newTier })
      }
      toast.success(`Tier updated to ${newTier}`)
    } catch (error) {
      handleApiError(error)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/admin/clients/${id}`)
      toast.success('Client deleted successfully')
      navigate('/admin/clients')
    } catch (error) {
      handleApiError(error)
    }
  }

  if (isLoading || !data) {
    return <LoadingSpinner />
  }

  const stats = data.stats || {}
  const revenueByMonth = (data.revenueByMonth || []).reverse()
  const orderStatuses = data.ordersByStatus || []
  const recentOrders: RecentOrder[] = data.recentOrders || []
  const products: ProductItem[] = data.products || []
  const topCustomers: TopCustomer[] = data.topCustomers || []

  const recentOrderColumns: Column<RecentOrder>[] = [
    {
      key: 'customerName',
      label: 'Customer',
      render: (value) => <span className="font-medium">{value || 'N/A'}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor: (ORDER_STATUS_COLORS[value] || '#6B7280') + '20',
            color: ORDER_STATUS_COLORS[value] || '#6B7280',
          }}
        >
          {String(value).replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'paymentStatus',
      label: 'Payment',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          value === 'paid' ? 'bg-green-100 text-green-800' : value === 'refunded' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => <span className="text-sm">{formatDate(value)}</span>,
    },
  ]

  const productColumns: Column<ProductItem>[] = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <span className="text-sm capitalize">{value}</span>,
    },
    {
      key: 'basePrice',
      label: 'Price',
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  const customerColumns: Column<TopCustomer>[] = [
    {
      key: 'name',
      label: 'Customer',
      render: (value, customer) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{customer.email}</p>
        </div>
      ),
    },
    {
      key: 'totalOrders',
      label: 'Orders',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'totalSpent',
      label: 'Total Spent',
      sortable: true,
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/admin/clients')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 font-medium"
        >
          <ArrowLeft size={20} />
          Back to Clients
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{data.name}</h1>
            <p className="text-lg text-muted-foreground">{data.bakeryName}</p>
            <p className="text-sm text-muted-foreground mt-1">{data.email}</p>
            {data.phone && <p className="text-sm text-muted-foreground">{data.phone}</p>}
            <p className="text-sm text-muted-foreground mt-2">
              Member since {formatDate(data.createdAt)}
            </p>
          </div>

          <div className="flex items-start gap-4">
            <div>
              <span
                className="px-4 py-2 rounded-lg font-medium capitalize inline-block"
                style={{
                  backgroundColor:
                    data.tier === 'hobby' ? '#E5E7EB'
                    : data.tier === 'growing' ? '#FEF3C7'
                    : data.tier === 'pro' ? '#FED7AA'
                    : '#FEE2E2',
                  color:
                    data.tier === 'hobby' ? '#1F2937'
                    : data.tier === 'growing' ? '#92400E'
                    : data.tier === 'pro' ? '#B45309'
                    : '#991B1B',
                }}
              >
                {data.tier}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Change Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="hobby">Hobby (Free)</option>
                <option value="growing">Starter ($29)</option>
                <option value="pro">Pro ($79)</option>
                <option value="enterprise">Enterprise ($199)</option>
              </select>
            </div>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-5"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue || 0)} />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={formatCurrency(stats.monthlyRevenue || 0)} />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats.totalOrders || 0} />
        <StatCard icon={Package} label="Products" value={stats.totalProducts || 0} />
        <StatCard icon={Users} label="Customers" value={stats.totalCustomers || 0} />
        <StatCard icon={Briefcase} label="Employees" value={stats.totalEmployees || 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Month */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue by Month</h3>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Bar dataKey="revenue" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Order Status Breakdown</h3>
          {orderStatuses.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }: any) => `${String(status).replace('_', ' ')}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {orderStatuses.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ORDER_STATUS_COLORS[entry.status] || '#6B7280'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No order data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Recent Orders</h3>
          <DataTable columns={recentOrderColumns} data={recentOrders} keyField="id" />
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Products ({products.length})</h3>
          <DataTable columns={productColumns} data={products} keyField="id" />
        </div>
      )}

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Top Customers</h3>
          <DataTable columns={customerColumns} data={topCustomers} keyField="id" />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-xl p-6">
            <h3 className="text-lg font-bold mb-2">Delete Client</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <strong>{data.name}</strong> and all their data? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-card-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
