import { cn } from '@/shared/lib/cn'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  highlight?: boolean
}

export function GlassCard({ children, className, highlight = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        'border border-white/[0.18]',
        'bg-white/[0.06]',
        'backdrop-blur-2xl',
        // outer shadow + inset top highlight in one declaration
        'shadow-[0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.14)]',
        className,
      )}
    >
      {/* subtle left edge accent */}
      {highlight && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/20 via-white/5 to-transparent" />
      )}
      {children}
    </div>
  )
}
