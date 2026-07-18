import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-confirm disabled:bg-draft disabled:text-paper-raised',
  secondary:
    'border border-line bg-paper-raised text-ink hover:border-ink disabled:opacity-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-draft-bg disabled:opacity-50',
  danger: 'bg-danger text-paper hover:bg-danger/90 disabled:bg-draft',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 px-4 font-display text-[13px] font-medium tracking-wide uppercase transition-colors duration-150 disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
