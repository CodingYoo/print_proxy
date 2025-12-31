import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  title: string
  render?: (item: T) => ReactNode
  className?: string
  width?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: keyof T
  emptyText?: string
  loading?: boolean
  className?: string
  onRowClick?: (item: T) => void
  selectedKeys?: (string | number)[]
  onSelectionChange?: (keys: (string | number)[]) => void
}

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyText = '暂无数据',
  loading,
  className,
  onRowClick,
  selectedKeys,
  onSelectionChange
}: TableProps<T>) {

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(data.map(item => item[rowKey] as unknown as (string | number)))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectRow = (key: string | number, checked: boolean) => {
    if (!onSelectionChange || !selectedKeys) return
    if (checked) {
      onSelectionChange([...selectedKeys, key])
    } else {
      onSelectionChange(selectedKeys.filter(k => k !== key))
    }
  }

  const isAllSelected = data.length > 0 && selectedKeys?.length === data.length
  const isIndeterminate = (selectedKeys?.length ?? 0) > 0 && (selectedKeys?.length ?? 0) < data.length

  return (
    <div className={cn("relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              {onSelectionChange && (
                <th className="w-12 px-4 h-11 text-center">
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </div>
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "h-11 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap",
                    col.className
                  )}
                  style={{ width: col.width }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-xs">加载中...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="h-40 text-center text-slate-400 bg-slate-50/30">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const key = item[rowKey] as unknown as (string | number)
                const isSelected = selectedKeys?.includes(key)
                return (
                  <tr
                    key={String(key)}
                    className={cn(
                      "transition-colors hover:bg-slate-50/80 group",
                      isSelected && "bg-indigo-50/40 hover:bg-indigo-50/60",
                      onRowClick && "cursor-pointer active:bg-slate-100"
                    )}
                    onClick={() => onRowClick && onRowClick(item)}
                  >
                    {onSelectionChange && (
                      <td className="p-4 w-12 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(key, e.target.checked)}
                          />
                        </div>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn("p-4 align-middle text-slate-700", col.className)}>
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
