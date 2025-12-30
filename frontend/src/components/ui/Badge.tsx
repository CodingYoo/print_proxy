import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' | 'error'
}

const variants = {
  default: 'border-transparent bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200',
  outline: 'text-slate-900 border-slate-200 hover:bg-slate-100',
  destructive: 'border-transparent bg-rose-500 text-white hover:bg-rose-600',
  success: 'border-transparent bg-emerald-500 text-white hover:bg-emerald-600',
  warning: 'border-transparent bg-amber-500 text-white hover:bg-amber-600',
  info: 'border-transparent bg-blue-500 text-white hover:bg-blue-600',
  error: 'border-transparent bg-rose-500 text-white hover:bg-rose-600',
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant = 'default', className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'
