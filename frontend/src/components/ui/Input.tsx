import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-slate-600 mb-2">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 px-4 py-3 text-slate-800 outline-none transition ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-rose-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
