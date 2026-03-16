import { getStatusColor, getPaymentStatusColor } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type?: 'status' | 'payment'
  className?: string
}

export function StatusBadge({ status, type = 'status', className = '' }: StatusBadgeProps) {
  const colorClass = type === 'payment' ? getPaymentStatusColor(status) : getStatusColor(status)

  const displayStatus = status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${colorClass} ${className}`}>
      {displayStatus}
    </span>
  )
}
