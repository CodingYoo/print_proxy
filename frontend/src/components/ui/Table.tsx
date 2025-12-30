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
}

export function Table<T>({ columns, data, rowKey, emptyText = '暂无数据', loading, className, onRowClick }: TableProps<T>) {
  return (
    <div className={cn("relative w-full overflow-auto rounded-lg border border-slate-200 bg-white", className)}>
      <table className="w-full caption-bottom text-sm text-left">
        <thead className="[&_tr]:border-b bg-slate-50 sticky top-0 z-10">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "h-10 px-4 align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0",
                  col.className
                )}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center">
                <div className="flex items-center justify-center text-slate-500">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  加载中...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center text-slate-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={String(item[rowKey])}
                className={cn(
                  "border-b transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-muted",
                  onRowClick && "cursor-pointer hover:bg-slate-50"
                )}
                onClick={() => onRowClick && onRowClick(item)}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", col.className)}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
