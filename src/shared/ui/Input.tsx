import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'h-12 w-full bg-transparent px-3.5 font-body text-[15px] text-ink outline-none',
          'placeholder:text-draft',
          'disabled:text-draft',
          className,
        )}
        {...props}
      />
    )
  },
)
