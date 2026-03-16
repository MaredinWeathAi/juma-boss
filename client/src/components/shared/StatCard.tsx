import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down'
    percentage: number
  }
  className?: string
}

export function StatCard({ icon: Icon, label, value, trend, className = '' }: StatCardProps) {
  return (
    <div className={`card p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon size={24} className="text-primary" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
            {trend.direction === 'up' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            {trend.percentage}%
          </div>
        )}
      </div>
      <p className="text-muted-foreground text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
