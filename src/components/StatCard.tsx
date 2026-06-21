import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: string | number
  icon: LucideIcon
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatCard({ title, value, change, icon: Icon, trend }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5',
        'bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-secondary)]',
        'border border-[var(--color-border)]'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--color-text-secondary)] mb-2">{title}</p>
          <p className="font-mono text-2xl font-medium text-[var(--color-text-primary)] tracking-tight">
            {value}
          </p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-xs font-medium',
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[var(--color-text-muted)]'
            )}>
              {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
              {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{typeof change === 'number' ? `${trend === 'up' ? '+' : trend === 'down' ? '-' : ''}${Math.abs(change)}%` : change}</span>
            </div>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[var(--color-accent)]" />
        </div>
      </div>
    </div>
  )
}
