import { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md'
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-white rounded-xl border border-slate-200 ${paddings[padding]} ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
