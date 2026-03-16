import { useEffect, useState } from 'react'
import { api, handleApiError } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { DataTable, Column } from '@/components/shared/DataTable'
import { SearchInput } from '@/components/shared/SearchInput'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { UserCheck, Plus, ToggleRight, ToggleLeft } from 'lucide-react'
import type { Employee } from '@/types'

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get('/employees')
        setEmployees(response.data || [])
      } catch (error) {
        handleApiError(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  const handleToggleStatus = async (employee: Employee) => {
    try {
      const response = await api.put(`/employees/${employee.id}`, {
        ...employee,
        status: employee.status === 'active' ? 'inactive' : 'active',
      })
      setEmployees(employees.map(e => e.id === employee.id ? response.data : e))
      toast.success(`Employee ${response.data.status === 'active' ? 'activated' : 'deactivated'}`)
    } catch (error) {
      handleApiError(error)
    }
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || employee.role === roleFilter

    return matchesSearch && matchesRole
  })

  const roles = ['all', ...new Set(employees.map(e => e.role))]

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className="capitalize px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
          {value}
        </span>
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
      key: 'hourlyRate',
      label: 'Hourly Rate',
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value, employee) => (
        <button
          onClick={() => handleToggleStatus(employee)}
          className={`flex items-center gap-2 text-sm font-medium ${
            value === 'active' ? 'text-success' : 'text-danger'
          }`}
        >
          {value === 'active' ? (
            <ToggleRight size={18} />
          ) : (
            <ToggleLeft size={18} />
          )}
          {value === 'active' ? 'Active' : 'Inactive'}
        </button>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <Header
        title="Employees"
        subtitle={`${filteredEmployees.length} employee${filteredEmployees.length !== 1 ? 's' : ''}`}
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search employees..."
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input"
          >
            {roles.map(role => (
              <option key={role} value={role}>
                {role === 'all' ? 'All Roles' : role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Table */}
      {filteredEmployees.length > 0 ? (
        <DataTable
          columns={columns}
          data={filteredEmployees}
          keyField="id"
        />
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No employees found"
          description="Add team members to manage shifts and tasks."
        />
      )}
    </div>
  )
}
