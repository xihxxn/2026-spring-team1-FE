import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-md border border-gray-300 px-3 text-sm outline-none',
          'focus:border-violet-500 focus:ring-2 focus:ring-violet-200',
          'disabled:bg-gray-50 disabled:text-gray-400',
          className,
        )}
        {...props}
      />
    )
  },
)
