import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700 disabled:bg-violet-300',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 disabled:opacity-50',
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  )
}
