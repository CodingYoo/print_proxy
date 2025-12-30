import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
        <input
          ref={ref}
          className={`w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition ${className}`}
          {...props}
        />
        {error && <p className="mt-0.5 text-[10px] text-rose-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
