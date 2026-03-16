import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { Users, Badge } from 'lucide-react'
import type { Customer } from '@/types'

export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get('/customers')
        setCustomers(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  )

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, customer) => (
        <div>
          <p className="font-medium">{value}</p>
          {customer.isWholesale && (
            <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-accent/10 text-accent rounded text-xs">
              <Badge size={12} />
              Wholesale
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <p className="text-sm">{value}</p>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => <p className="text-sm">{value || '-'}</p>,
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

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Customers"
        subtitle={`${filteredCustomers.length} customer${filteredCustomers.length !== 1 ? 's' : ''}`}
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search customers..."
        />
      </div>

      {/* Customers Table */}
      {filteredCustomers.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          keyField="id"
          onRowClick={(customer) => navigate(`/customers/${customer.id}`)}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Your customers will appear here as you create orders."
        />
      )}
    </div>
  )
}
