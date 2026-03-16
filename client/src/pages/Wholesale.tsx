import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { Plus, Building2 } from 'lucide-react'
import type { WholesaleAccount } from '@/types'

export default function Wholesale() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<WholesaleAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await api.get('/wholesale')
        setAccounts(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAccounts()
  }, [])

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || account.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const columns: Column<WholesaleAccount>[] = [
    {
      key: 'companyName',
      label: 'Company',
      sortable: true,
    },
    {
      key: 'contactName',
      label: 'Contact',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => <p className="text-sm">{value}</p>,
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => <p className="text-sm">{value}</p>,
    },
    {
      key: 'discountPercentage',
      label: 'Discount',
      sortable: true,
      render: (value) => <span className="font-medium">{value}%</span>,
    },
    {
      key: 'paymentTerms',
      label: 'Payment Terms',
      render: (value) => <p className="text-sm">{value}</p>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Wholesale Accounts"
        subtitle={`${filteredAccounts.length} account${filteredAccounts.length !== 1 ? 's' : ''}`}
        actions={
          <button className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            New Account
          </button>
        }
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search accounts..."
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
      {filteredAccounts.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredAccounts}
          keyField="id"
        />
      ) : (
        <EmptyState
          icon={Building2}
          title="No wholesale accounts"
          description="Add wholesale partners to manage bulk orders."
        />
      )}
    </div>
  )
}
