import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatCard } from '@/components/shared/StatCard'
import { DataTable, Column } from '@/components/shared/DataTable'
import { formatCurrency } from '@/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign } from 'lucide-react'
import type { RevenueData } from '@/types'

interface ProductProfitability {
  productId: string
  productName: string
  revenue: number
  cost: number
  profit: number
  marginPercentage: number
}

interface ExpenseCategory {
  category: string
  amount: number
}

export default function Financial() {
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [products, setProducts] = useState<ProductProfitability[]>([])
  const [expenses, setExpenses] = useState<ExpenseCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    ytd: 0,
  })

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const [revenueRes, productsRes, expensesRes, statsRes] = await Promise.all([
          api.get('/financial/revenue'),
          api.get('/financial/product-profitability'),
          api.get('/financial/expenses'),
          api.get('/financial/stats'),
        ])

        setRevenueData(revenueRes.data || [])
        setProducts(productsRes.data || [])
        setExpenses(expensesRes.data || [])
        setStats(statsRes.data)
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFinancialData()
  }, [])

  if (isLoading) {
    return <LoadingSpinner />
  }

  const productColumns: Column<ProductProfitability>[] = [
    {
      key: 'productName',
      label: 'Product',
      sortable: true,
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'cost',
      label: 'Cost',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'profit',
      label: 'Profit',
      sortable: true,
      render: (value, item) => (
        <span className={value > 0 ? 'text-success font-medium' : 'text-danger font-medium'}>
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'marginPercentage',
      label: 'Margin',
      sortable: true,
      render: (value) => <span className="font-medium">{value.toFixed(1)}%</span>,
    },
  ]

  const topProducts = [...products].sort((a, b) => b.profit - a.profit).slice(0, 3)
  const worstProducts = [...products].sort((a, b) => a.profit - b.profit).slice(0, 3)

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const totalCost = revenueData.reduce((sum, d) => sum + d.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  return (
    <div>
      <Header
        title="Financial Dashboard"
        subtitle="Monitor revenue, costs, and profitability"
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="This Month"
          value={formatCurrency(stats.thisMonth)}
          trend={{ direction: 'up', percentage: 12 }}
        />
        <StatCard
          icon={TrendingUp}
          label="Last Month"
          value={formatCurrency(stats.lastMonth)}
          trend={{ direction: 'down', percentage: 5 }}
        />
        <StatCard
          icon={DollarSign}
          label="Year to Date"
          value={formatCurrency(stats.ytd)}
          trend={{ direction: 'up', percentage: 28 }}
        />
        <StatCard
          icon={TrendingUp}
          label="Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          trend={{ direction: 'up', percentage: 8 }}
        />
      </div>

      {/* Revenue Chart */}
      {revenueData.length > 0 && (
        <div className="card p-6 mb-8">
          <h3 className="text-lg font-semibold mb-6">Revenue vs Cost Trend</h3>
          <ResponsiveContainer width="100%" height={350}>
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
              <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Product Profitability */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold mb-6">Product Profitability</h3>
        <DataTable columns={productColumns} data={products} keyField="productId" />
      </div>

      {/* Top & Worst Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Products */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.productId} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                <div>
                  <p className="text-sm font-medium">{idx + 1}. {product.productName}</p>
                  <p className="text-xs text-success font-medium">{formatCurrency(product.profit)} profit</p>
                </div>
                <span className="text-sm font-semibold text-success">{product.marginPercentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Worst Performers */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Need Attention</h3>
          <div className="space-y-3">
            {worstProducts.map((product, idx) => (
              <div key={product.productId} className="flex items-center justify-between p-3 bg-card-hover rounded-lg">
                <div>
                  <p className="text-sm font-medium">{idx + 1}. {product.productName}</p>
                  <p className={`text-xs font-medium ${product.profit < 0 ? 'text-danger' : 'text-warning'}`}>
                    {formatCurrency(product.profit)} profit
                  </p>
                </div>
                <span className={`text-sm font-semibold ${product.profit < 0 ? 'text-danger' : 'text-warning'}`}>
                  {product.marginPercentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Categories */}
      {expenses.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-6">Expense Categories</h3>
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.category} className="flex items-center justify-between p-4 bg-card-hover rounded-lg">
                <span className="font-medium">{expense.category}</span>
                <span className="font-semibold">{formatCurrency(expense.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
