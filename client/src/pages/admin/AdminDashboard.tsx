import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable, Column } from '@/components/shared/DataTable'
import { formatCurrency } from '@/lib/utils'
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
import { Users, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react'

interface TopBaker {
  id: string
  name: string
  bakeryName: string
  tier: string
  orderCount: number
  revenue: number
}

interface TopProduct {
  name: string
  bakeryName: string
  category: string
  timesOrdered: number
  revenue: number
}

const TIER_COLORS: Record<string, string> = {
  hobby: '#6B7280',
  growing: '#F59E0B',
  pro: '#F97316',
  enterprise: '#DC2626',
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // Only 2 endpoints exist: /admin/stats and /admin/analytics
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
        ])

        setStats(statsRes)
        setAnalytics(analyticsRes)
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Map data from API responses
  const tierDistribution = (stats?.tierBreakdown || []).map((t: any) => ({
    ...t,
    color: TIER_COLORS[t.tier] || '#666',
  }))

  const revenueByTier = (stats?.revenueByTier || []).map((t: any) => ({
    ...t,
    color: TIER_COLORS[t.tier] || '#666',
  }))

  const dailyOrders = analytics?.dailyOrders || []
  const topBakers: TopBaker[] = analytics?.topBakers || []
  const topProducts: TopProduct[] = analytics?.topProducts || []

  const bakerColumns: Column<TopBaker>[] = [
    {
      key: 'name',
      label: 'Baker',
      render: (value, baker) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{baker.bakeryName}</p>
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (value) => (
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor: (TIER_COLORS[value] || '#666') + '20',
            color: TIER_COLORS[value] || '#666',
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'orderCount',
      label: 'Orders',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
  ]

  const productColumns: Column<TopProduct>[] = [
    {
      key: 'name',
      label: 'Product',
      render: (value, product) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">{product.bakeryName}</p>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <span className="text-sm capitalize">{value}</span>,
    },
    {
      key: 'timesOrdered',
      label: 'Times Ordered',
      sortable: true,
      render: (value) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => <span className="font-medium">{formatCurrency(value)}</span>,
    },
  ]

  return (
    <div>
      <Header
        title="Platform Dashboard"
        subtitle="Juma Boss Master Control"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Bakers"
          value={stats?.totalBakers || 0}
        />
        <StatCard
          icon={TrendingUp}
          label="Active Bakers (30 days)"
          value={stats?.activeBakers || 0}
        />
        <StatCard
          icon={DollarSign}
          label="Platform MRR"
          value={formatCurrency(stats?.mrr || 0)}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={stats?.totalOrders || 0}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
        />
        <StatCard
          icon={Users}
          label="Total Customers"
          value={stats?.totalCustomers || 0}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tier Distribution */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Tier Distribution</h3>
          {tierDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tierDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tier, count }: any) => `${tier}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {tierDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.tier] || '#666'} />
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

        {/* Revenue by Tier */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Revenue by Tier</h3>
          {revenueByTier.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByTier}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tier" stroke="hsl(var(--muted-foreground))" />
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
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Daily Orders Chart */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Daily Orders (Last 30 Days)</h3>
        {dailyOrders.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyOrders}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#F97316" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        )}
      </div>

      {/* Top Performing Bakers */}
      {topBakers.length > 0 && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Top Performing Bakers</h3>
            <Link to="/admin/clients" className="text-primary hover:text-primary-hover text-sm font-medium">
              View all
            </Link>
          </div>
          <DataTable
            columns={bakerColumns}
            data={topBakers}
            keyField="id"
            onRowClick={(baker) => {
              window.location.href = `/admin/clients/${baker.id}`
            }}
          />
        </div>
      )}

      {/* Top Products Across Platform */}
      {topProducts.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Top Products Across Platform</h3>
          <DataTable
            columns={productColumns}
            data={topProducts}
            keyField="name"
          />
        </div>
      )}
    </div>
  )
}
