import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className = '', ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
        <select
          ref={ref}
          className={`w-full rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none transition ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'
