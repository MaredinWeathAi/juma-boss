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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft, DollarSign, ShoppingCart, Users, Package, Briefcase } from 'lucide-react'

interface ClientDetail {
  id: string
  name: string
  bakeryName: string
  email: string
  tier: string
  createdAt: string
  totalRevenue: number
  monthlyRevenue: number
  totalOrders: number
  totalProducts: number
  totalCustomers: number
  employeeCount: number
}

interface RevenueMonth {
  month: string
  revenue: number
}

interface OrderStatus {
  status: string
  count: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
}

interface Product {
  id: string
  name: string
  category: string
  basePrice: number
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
  const [client, setClient] = useState<ClientDetail | null>(null)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueMonth[]>([])
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const [clientRes, revenueRes, ordersRes, recentRes, productsRes, customersRes] = await Promise.all([
          api.get(`/admin/clients/${id}`),
          api.get(`/admin/clients/${id}/revenue-by-month`),
          api.get(`/admin/clients/${id}/order-statuses`),
          api.get(`/admin/clients/${id}/recent-orders`),
          api.get(`/admin/clients/${id}/products`),
          api.get(`/admin/clients/${id}/top-customers`),
        ])

        setClient(clientRes.data || clientRes)
        setRevenueByMonth(revenueRes.data || revenueRes || [])
        setOrderStatuses(ordersRes.data || ordersRes || [])
        setRecentOrders(recentRes.data || recentRes || [])
        setProducts(productsRes.data || productsRes || [])
        setTopCustomers(customersRes.data || customersRes || [])
        setSelectedTier(clientRes.data?.tier || clientRes.tier || '')
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
      if (client) {
        setClient({ ...client, tier: newTier })
      }
    } catch (error) {
      handleApiError(error)
    }
  }

  if (isLoading || !client) {
    return <LoadingSpinner />
  }

  const recentOrderColumns: Column<RecentOrder>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'total',
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
            backgroundColor: ORDER_STATUS_COLORS[value] + '20',
            color: ORDER_STATUS_COLORS[value],
          }}
        >
          {value.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => <span className="text-sm">{formatDate(value)}</span>,
    },
  ]

  const productColumns: Column<Product>[] = [
    {
      key: 'name',
      label: 'Product Name',
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <span className="text-sm">{value}</span>,
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

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{client.name}</h1>
            <p className="text-lg text-muted-foreground">{client.bakeryName}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Member since {formatDate(client.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="px-4 py-2 rounded-lg font-medium capitalize"
              style={{
                backgroundColor:
                  client.tier === 'hobby'
                    ? '#E5E7EB'
                    : client.tier === 'growing'
                      ? '#FEF3C7'
                      : client.tier === 'pro'
                        ? '#FED7AA'
                        : '#FEE2E2',
                color:
                  client.tier === 'hobby'
                    ? '#1F2937'
                    : client.tier === 'growing'
                      ? '#92400E'
                      : client.tier === 'pro'
                        ? '#B45309'
                        : '#991B1B',
              }}
            >
              {client.tier}
            </span>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Change Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="hobby">Hobby</option>
                <option value="growing">Growing</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(client.totalRevenue)}
        />
        <StatCard
          icon={DollarSign}
          label="Monthly Revenue"
          value={formatCurrency(client.monthlyRevenue)}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={client.totalOrders}
        />
        <StatCard
          icon={Package}
          label="Products"
          value={client.totalProducts}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={client.totalCustomers}
        />
        <StatCard
          icon={Briefcase}
          label="Employees"
          value={client.employeeCount}
        />
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
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Bar dataKey="revenue" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
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
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {orderStatuses.map((entry, index) => (
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
              No data available
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
          <h3 className="text-lg font-semibold mb-6">Products</h3>
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
    </div>
  )
}
