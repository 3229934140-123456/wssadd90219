import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface StatusBadgeProps {
  status: string
  variant?: BadgeVariant
  colorMap?: Record<string, BadgeVariant>
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border-red-500/20',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  default: 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
}

const dotStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-blue-400',
  default: 'bg-[var(--color-text-muted)]',
}

export default function StatusBadge({ status, variant, colorMap }: StatusBadgeProps) {
  const resolvedVariant: BadgeVariant = variant ?? colorMap?.[status] ?? 'default'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variantStyles[resolvedVariant]
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', dotStyles[resolvedVariant])} />
      {status}
    </span>
  )
}
