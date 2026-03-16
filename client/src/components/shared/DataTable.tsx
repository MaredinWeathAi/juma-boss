import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (item: T) => void
  isLoading?: boolean
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  isLoading = false,
  className = '',
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(columnKey)
      setSortOrder('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0

    const aValue = a[sortBy]
    const bValue = b[sortBy]

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  if (isLoading) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">No data found</div>
      </div>
    )
  }

  return (
    <div className={`card overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border hover:bg-card-hover transition-colors">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-6 py-3 text-left text-sm font-semibold text-muted-foreground ${
                  column.sortable ? 'cursor-pointer hover:text-foreground' : ''
                } ${column.width || ''}`}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && sortBy === String(column.key) && (
                    sortOrder === 'asc' ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr
              key={String(item[keyField])}
              className={`border-b border-border hover:bg-card-hover transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4 text-sm">
                  {column.render ? column.render(item[String(column.key)], item) : item[String(column.key)]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
