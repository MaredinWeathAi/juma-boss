import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm')
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
    case 'pending_payment':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    case 'confirmed':
    case 'active':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
    case 'in_production':
    case 'in_progress':
      return 'bg-orange-500/10 text-orange-400 border-orange-500/30'
    case 'ready':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    case 'completed':
    case 'paid':
      return 'bg-green-500/10 text-green-400 border-green-500/30'
    case 'cancelled':
    case 'refunded':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    case 'inactive':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
    case 'paid':
      return 'bg-green-500/10 text-green-400 border-green-500/30'
    case 'refunded':
      return 'bg-red-500/10 text-red-400 border-red-500/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
}
