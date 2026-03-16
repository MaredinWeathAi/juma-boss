import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable, Column } from '@/components/shared/DataTable'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, AlertTriangle, Plus, Clock } from 'lucide-react'
import type { Order, DashboardStats, RevenueData, Product } from '@/types'

interface LowStockIngredient {
  id: string
  name: string
  currentStock: number
  minimumLevel: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [topProducts, setTopProducts] = useState<Array<{ name: string; revenue: number; orders: number }>>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockIngredient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, revenueRes, ordersRes, productsRes, inventoryRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/revenue'),
          api.get('/orders?limit=10'),
          api.get('/dashboard/top-products'),
          api.get('/inventory/low-stock'),
        ])

        setStats(statsRes.data)
        setRevenueData(revenueRes.data || [])
        setOrders(ordersRes.data || [])
        setTopProducts(productsRes.data || [])
        setLowStockItems(inventoryRes.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const orderColumns: Column<Order>[] = [
    {
      key: 'orderNumber',
      label: 'Order #',
      sortable: true,
    },
    {
      key: 'customerId',
      label: 'Customer',
      render: (value) => `Customer ${value.slice(0, 8)}`,
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

  const costBreakdown = revenueData.length > 0 ? [
    { name: 'Revenue', value: revenueData.reduce((sum, d) => sum + d.revenue, 0) },
    { name: 'Cost', value: revenueData.reduce((sum, d) => sum + d.cost, 0) },
    { name: 'Profit', value: revenueData.reduce((sum, d) => sum + d.profit, 0) },
  ] : []

  const COLORS = ['#F97316', '#F59E0B', '#10B981']

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Welcome back! Here's your bakery overview."
        actions={
          <div className="flex gap-3">
            <Link to="/orders/new" className="btn-primary flex items-center gap-2">
              <Plus size={18} />
              New Order
            </Link>
            <Link to="/products/new" className="btn-secondary flex items-center gap-2">
              <Plus size={18} />
              Add Product
            </Link>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Revenue This Month"
          value={stats ? formatCurrency(stats.revenueThisMonth) : '$0'}
          trend={{ direction: 'up', percentage: 12 }}
        />
        <StatCard
          icon={Clock}
          label="Orders Today"
          value={stats?.ordersToday || 0}
          trend={{ direction: 'up', percentage: 8 }}
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Orders"
          value={stats?.pendingOrders || 0}
          trend={{ direction: 'down', percentage: 5 }}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Customers"
          value={stats?.totalCustomers || 0}
          trend={{ direction: 'up', percentage: 15 }}
        />
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="card p-6 mb-8 border-l-4 border-warning">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-warning" />
            Low Stock Alerts
          </h3>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                <span className="text-sm">{item.name}</span>
                <span className="text-xs text-warning font-medium">
                  {item.currentStock} / {item.minimumLevel} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue Trend</h3>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Cost Breakdown</h3>
          {costBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {topProducts.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#F97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Recent Orders</h3>
          <Link to="/orders" className="text-primary hover:text-primary-hover text-sm font-medium">
            View all
          </Link>
        </div>
        <DataTable columns={orderColumns} data={orders} keyField="id" />
      </div>
    </div>
  )
}
