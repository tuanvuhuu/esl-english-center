import React, { useMemo, useState, useRef, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
  type ColumnPinningState,
  type ColumnSizingState,
  type Row,
} from '@tanstack/react-table'
import { Icon } from './Icon'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataGridColumn<T = any> {
  key: string
  title: string
  render?: (row: T, idx: number) => React.ReactNode
  filterable?: boolean
  filterType?: 'text' | 'select'
  filterOptions?: { value: string; label: string }[]
  filterValue?: (row: T) => string
  width?: number
  align?: 'left' | 'center' | 'right'
  noWrap?: boolean
  sortable?: boolean
  pin?: 'left' | 'right'
  isAllowCopy?: boolean
}

interface DataGridProps<T = any> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  onAdd?: () => void
  addLabel?: string
  onRefresh?: () => void
  columns: DataGridColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  loading?: boolean
  defaultPageSize?: number
  exportFilename?: string
  emptyText?: string
  enableRowSelection?: boolean
  onSelectionChange?: (rows: T[]) => void
  maxHeight?: number | string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50, 100]

// Sticky styles for pinned columns — header cells need extra top offset for thead sticky
const getPinnedStyle = (column: any, isHeader = false): React.CSSProperties => {
  const pinned = column.getIsPinned()
  if (!pinned) return {}
  return {
    position: 'sticky',
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    zIndex: isHeader ? 4 : 1,
    background: isHeader ? 'var(--table-header)' : 'var(--card)',
    boxShadow: pinned === 'left'
      ? '4px 0 12px -6px rgba(11,37,69,0.12)'
      : '-4px 0 12px -6px rgba(11,37,69,0.12)',
  }
}

const SortIndicator = ({ direction }: { direction: false | 'asc' | 'desc' }) => (
  <span style={{
    display: 'inline-flex', flexDirection: 'column',
    marginLeft: 4, lineHeight: 0.8, flexShrink: 0,
  }}>
    <span style={{
      fontSize: 8,
      color: direction === 'asc' ? 'var(--primary)' : 'var(--text-4)',
      opacity: direction === 'asc' ? 1 : 0.45,
      transition: 'color 0.15s, opacity 0.15s',
    }}>▲</span>
    <span style={{
      fontSize: 8, marginTop: 1,
      color: direction === 'desc' ? 'var(--primary)' : 'var(--text-4)',
      opacity: direction === 'desc' ? 1 : 0.45,
      transition: 'color 0.15s, opacity 0.15s',
    }}>▼</span>
  </span>
)

// ─── Sub-components ──────────────────────────────────────────────────────────

const IndeterminateCheckbox = React.memo(({ checked, indeterminate, onChange, onClick, disabled }: {
  checked?: boolean
  indeterminate?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onClick?: React.MouseEventHandler<HTMLInputElement>
  disabled?: boolean
}) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <div style={{
      position: 'relative',
      width: 16,
      height: 16,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        disabled={disabled}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'inherit',
          margin: 0,
          zIndex: 2,
        }}
      />
      <div style={{
        width: 16,
        height: 16,
        borderRadius: 4,
        border: `1.5px solid ${checked || indeterminate ? 'var(--primary)' : 'var(--border)'}`,
        background: checked || indeterminate ? 'var(--primary)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        color: '#ffffff',
        opacity: disabled ? 0.5 : 1,
        zIndex: 1,
      }}>
        {checked && !indeterminate && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 10, height: 10 }}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {indeterminate && (
          <div style={{
            width: 8,
            height: 2,
            background: '#ffffff',
            borderRadius: 1,
          }} />
        )}
      </div>
    </div>
  )
})

const FilterInput = React.memo(({ value: initialValue, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (value !== initialValue) {
        onChange(value)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [value, onChange, initialValue])

  return (
    <div style={{ position: 'relative', marginTop: 6, textTransform: 'none' }}>
      <Icon
        name="search"
        size={11}
        style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: value ? 'var(--primary)' : 'var(--text-4)', pointerEvents: 'none', transition: 'color 0.15s' }}
      />
      <input
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Lọc..."
        style={{
          width: '100%', height: 28,
          padding: value ? '0 24px 0 26px' : '0 8px 0 26px',
          border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 7, fontSize: 11, fontWeight: 500, fontFamily: 'var(--font)',
          background: value ? 'var(--primary-light)' : 'var(--input-bg)',
          color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box',
          letterSpacing: 0,
          transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--primary-15)';
        }}
        onBlur={e => {
          e.target.style.borderColor = value ? 'var(--primary)' : 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          onClick={() => {
            setValue('')
            onChange('')
          }}
          style={{
            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--primary)', border: 'none', cursor: 'pointer',
            color: '#fff', padding: 0, lineHeight: 1, fontSize: 11,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>
      )}
    </div>
  )
})

const FilterSelect = React.memo(({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', height: 28, marginTop: 6,
      padding: '0 24px 0 10px',
      border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
      borderRadius: 7, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)',
      background: value ? 'var(--primary-light)' : 'var(--input-bg)',
      color: value ? 'var(--primary)' : 'var(--text-2)',
      outline: 'none', cursor: 'pointer',
      letterSpacing: 0, textTransform: 'none',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 8px center',
      transition: 'border-color 0.15s, background 0.15s',
    }}
  >
    <option value="">Tất cả</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
))

// ─── Main Component ───────────────────────────────────────────────────────────

export function DataGrid<T = any>({
  title, subtitle, actions,
  onAdd, addLabel = 'Thêm mới', onRefresh,
  columns, data, rowKey,
  onRowClick, loading,
  defaultPageSize = 20,
  exportFilename = 'export',
  emptyText = 'Không có dữ liệu',
  enableRowSelection = false,
  onSelectionChange,
  maxHeight = 'calc(100vh - 210px)',
}: DataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const columnPinning = useMemo<ColumnPinningState>(() => {
    const left: string[] = []
    const right: string[] = []
    if (enableRowSelection) left.push('_select')
    columns.forEach(col => {
      if (col.pin === 'left') left.push(col.key)
      if (col.pin === 'right') right.push(col.key)
    })
    return { left, right }
  }, [columns, enableRowSelection])

  const tanstackColumns = useMemo<ColumnDef<T>[]>(() => {
    const defs: ColumnDef<T>[] = []

    if (enableRowSelection) {
      defs.push({
        id: '_select',
        size: 40,
        enableResizing: false,
        enableSorting: false,
        enableColumnFilter: false,
        header: ({ table }) => (
          <IndeterminateCheckbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <IndeterminateCheckbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            onClick={e => e.stopPropagation()}
          />
        ),
      })
    }

    columns.forEach(col => {
      defs.push({
        id: col.key,
        accessorFn: (row: T) =>
          col.filterValue ? col.filterValue(row) : (row as any)[col.key],
        header: col.title,
        size: col.width ?? 150,
        enableResizing: true,
        enableSorting: col.sortable !== false,
        enableColumnFilter: col.filterable ?? false,
        filterFn: (row: Row<T>, _columnId: string, filterValue: string) => {
          if (!filterValue) return true
          const cellValue = col.filterValue
            ? col.filterValue(row.original)
            : String((row.original as any)[col.key] ?? '')
          if (col.filterType === 'select') return cellValue === filterValue
          return cellValue.toLowerCase().includes(filterValue.toLowerCase())
        },
        cell: col.render
          ? ({ row }) => col.render!(row.original, row.index)
          : ({ row }) => {
              const v = (row.original as any)[col.key]
              return v != null ? String(v) : '—'
            },
      })
    })

    return defs
  }, [columns, enableRowSelection])

  const table = useReactTable({
    data,
    columns: tanstackColumns,
    state: { sorting, columnFilters, rowSelection, columnSizing, columnPinning },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: updater => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(next)
      if (onSelectionChange) {
        onSelectionChange(data.filter(row => next[String(rowKey(row))]))
      }
    },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    enableRowSelection,
    getRowId: (row, index) => String(rowKey ? rowKey(row) : index),
    initialState: { pagination: { pageSize: defaultPageSize, pageIndex: 0 } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalFiltered = table.getFilteredRowModel().rows.length
  const from = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, totalFiltered)
  const activeFilters = columnFilters.filter(f => f.value).length
  const selectedCount = Object.keys(rowSelection).length
  const hasFilterRow = columns.some(c => c.filterable)

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows
    const header = columns.map(c => `"${c.title}"`).join(',')
    const body = rows.map(row =>
      columns.map(col => {
        const v = col.filterValue
          ? col.filterValue(row.original)
          : String((row.original as any)[col.key] ?? '')
        return `"${v.replace(/"/g, '""')}"`
      }).join(',')
    )
    const csv = '﻿' + [header, ...body].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `${exportFilename}.csv`,
    })
    a.click()
  }

  const totalPages = table.getPageCount()
  const pageNums: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pageNums.push(i + 1)
  } else {
    pageNums.push(1)
    if (pageIndex > 2) pageNums.push('...')
    for (let i = Math.max(1, pageIndex - 1); i <= Math.min(totalPages - 2, pageIndex + 1); i++) pageNums.push(i + 1)
    if (pageIndex < totalPages - 3) pageNums.push('...')
    pageNums.push(totalPages)
  }



  const headerGroups = table.getHeaderGroups()

  return (
    <div style={{
      background: 'var(--card)',
      borderRadius: 18,
      border: '1px solid var(--border-light)',
      overflow: 'hidden',
      boxShadow: '0 4px 12px -4px rgba(11,37,69,0.06), 0 1px 3px rgba(11,37,69,0.04)',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{`
        .data-grid-row {
          position: relative;
        }
        .data-grid-row:hover:not(.is-selected) {
          background: var(--table-row-hover) !important;
        }
        .data-grid-row.is-selected td:first-child::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--primary);
        }
        .data-grid-btn-primary {
          transition: transform 0.15s, box-shadow 0.2s;
        }
        .data-grid-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -6px rgba(255,107,53,0.50);
        }
        .data-grid-btn-secondary {
          transition: all 0.15s;
        }
        .data-grid-btn-secondary:hover:not(:disabled) {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          background: var(--primary-light) !important;
        }
        .data-grid-pagination-btn {
          transition: all 0.15s;
        }
        .data-grid-pagination-btn:hover:not(:disabled) {
          border-color: var(--primary) !important;
          color: var(--primary) !important;
          background: var(--primary-light) !important;
        }
        .data-grid-warning-btn {
          transition: all 0.15s;
        }
        .data-grid-warning-btn:hover:not(:disabled) {
          background: var(--warning-bg) !important;
          opacity: 0.88;
        }
        .data-grid-resize-handle:hover {
          background: var(--primary) !important;
          opacity: 0.5;
        }
        .data-grid-sort-th:hover .sort-ind {
          opacity: 1 !important;
        }
      `}</style>

      {/* ── Card Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-light)',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--input-bg-subtle) 100%)',
        gap: 12, flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {title && (
            <span style={{
              width: 4, height: 22, borderRadius: 2,
              background: 'linear-gradient(180deg, var(--primary), var(--primary-dark))',
              flexShrink: 0,
            }} />
          )}
          <div style={{ minWidth: 0 }}>
            {title && (
              <div style={{
                fontSize: 14, fontWeight: 800, color: 'var(--text-1)',
                letterSpacing: -0.1, lineHeight: 1.2,
              }}>{title}</div>
            )}
            {subtitle && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{subtitle}</div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {selectedCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, color: 'var(--primary)', fontWeight: 700,
              padding: '5px 11px',
              background: 'var(--primary-light)',
              border: '1px solid var(--primary-15)',
              borderRadius: 8,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
              {selectedCount} đã chọn
            </span>
          )}
          {activeFilters > 0 && (
            <button
              onClick={() => { setColumnFilters([]); table.setPageIndex(0) }}
              className="data-grid-warning-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 8, border: '1px solid var(--warning-border)', background: 'var(--warning-bg)', color: 'var(--warning-text)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font)', cursor: 'pointer' }}
            >
              <Icon name="x" size={11} /> Xoá lọc ({activeFilters})
            </button>
          )}

          {/* Divider before action buttons */}
          {(onRefresh || onAdd || actions) && (
            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />
          )}

          {actions}

          {onAdd && (
            <button
              onClick={onAdd}
              className="data-grid-btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', height: 32, borderRadius: 9,
                border: 'none',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: '#fff', fontSize: 12, fontWeight: 700,
                fontFamily: 'var(--font)', cursor: 'pointer', flexShrink: 0,
                boxShadow: '0 4px 12px -4px rgba(255,107,53,0.45)',
                letterSpacing: 0.2,
              }}
            >
              <Icon name="plus" size={14} /> {addLabel}
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Làm mới"
              className="data-grid-btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}
            >
              <Icon name="refresh" size={14} />
            </button>
          )}

          <button
            onClick={handleExport}
            title="Export CSV"
            className="data-grid-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}
          >
            <Icon name="download" size={14} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Table Area ── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight, flexShrink: 1 }}>
        <table style={{ minWidth: '100%', width: table.getTotalSize(), borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr
                key={headerGroup.id}
                style={{
                  background: 'var(--table-header)',
                  borderBottom: '1px solid var(--border)',
                  position: 'sticky', top: 0, zIndex: 2,
                  boxShadow: '0 1px 0 var(--border-light)',
                }}
              >
                {headerGroup.headers.map(header => {
                  const colDef = columns.find(c => c.key === header.column.id)
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const filterVal = (header.column.getFilterValue() as string) ?? ''
                  return (
                    <th
                      key={header.id}
                      className={canSort ? 'data-grid-sort-th' : ''}
                      style={{
                        width: header.getSize(),
                        padding: hasFilterRow ? '10px 12px 8px' : '12px 14px',
                        textAlign: colDef?.align ?? 'left',
                        fontWeight: 700,
                        color: sorted ? 'var(--primary)' : 'var(--text-2)',
                        fontSize: 11,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap', userSelect: 'none',
                        position: 'relative',
                        verticalAlign: 'top',
                        background: 'var(--table-header)',
                        ...getPinnedStyle(header.column, true),
                      }}
                    >
                      {/* Title row with sort */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: colDef?.align === 'right' ? 'flex-end' : colDef?.align === 'center' ? 'center' : 'flex-start',
                          gap: 2,
                          cursor: canSort ? 'pointer' : 'default',
                        }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="sort-ind" style={{ opacity: sorted ? 1 : 0.4, transition: 'opacity 0.15s' }}>
                            <SortIndicator direction={sorted} />
                          </span>
                        )}
                      </div>

                      {/* Inline filter below title */}
                      {colDef?.filterable && (
                        colDef.filterType === 'select' && colDef.filterOptions
                          ? <FilterSelect
                              value={filterVal}
                              onChange={v => { header.column.setFilterValue(v || undefined); table.setPageIndex(0) }}
                              options={colDef.filterOptions}
                            />
                          : <FilterInput
                              value={filterVal}
                              onChange={v => { header.column.setFilterValue(v || undefined); table.setPageIndex(0) }}
                            />
                      )}

                      {/* Resize handle */}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="data-grid-resize-handle"
                          style={{
                            position: 'absolute', right: 0, top: 8, bottom: 8, width: 3,
                            cursor: 'col-resize', userSelect: 'none', touchAction: 'none',
                            background: header.column.getIsResizing() ? 'var(--primary)' : 'transparent',
                            borderRadius: 2,
                            transition: 'background 0.15s, opacity 0.15s',
                            opacity: header.column.getIsResizing() ? 1 : 0,
                          }}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={tanstackColumns.length} style={{ padding: 64, textAlign: 'center', color: 'var(--text-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, border: '3px solid var(--border-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Đang tải dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={tanstackColumns.length} style={{ padding: 64, textAlign: 'center', color: 'var(--text-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: 'var(--input-bg-subtle)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-4)',
                    }}>
                      <Icon name="search" size={24} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{emptyText}</div>
                    {activeFilters > 0 && (
                      <button
                        onClick={() => { setColumnFilters([]); table.setPageIndex(0) }}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--card)', color: 'var(--text-2)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'var(--font)',
                        }}>
                        Xoá bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={`data-grid-row ${row.getIsSelected() ? 'is-selected' : ''}`}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.15s',
                    background: row.getIsSelected() ? 'var(--primary-light)' : 'transparent',
                  }}
                >
                  {row.getVisibleCells().map(cell => {
                    const colDef = columns.find(c => c.key === cell.column.id)
                    return (
                      <td
                        key={cell.id}
                        className="grid-cell"
                        style={{
                          padding: '11px 14px',
                          textAlign: colDef?.align ?? 'left',
                          color: 'var(--text-1)',
                          fontSize: 13,
                          whiteSpace: colDef?.noWrap ? 'nowrap' : undefined,
                          verticalAlign: 'middle',
                          width: cell.column.getSize(),
                          position: 'relative',
                          ...getPinnedStyle(cell.column),
                          ...(row.getIsSelected() && cell.column.getIsPinned() ? { background: 'var(--primary-light)' } : {}),
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 5 }}>
                          <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                          {colDef?.isAllowCopy && (
                            <button
                              className="copy-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                const val = cell.getValue();
                                const textToCopy = val != null ? String(val) : '';
                                navigator.clipboard.writeText(textToCopy);
                                const btn = e.currentTarget as HTMLButtonElement;
                                btn.style.color = 'var(--primary)';
                                setTimeout(() => { btn.style.color = ''; }, 1000);
                              }}
                              title="Copy"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                color: 'var(--text-4)',
                                display: 'flex',
                                alignItems: 'center',
                                flexShrink: 0,
                                marginTop: -2,
                              }}
                            >
                              <Icon name="copy" size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 18px',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--input-bg-subtle)',
        gap: 12, flexWrap: 'wrap', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {totalFiltered === 0
            ? <>Không có kết quả</>
            : <>Hiển thị <strong style={{ color: 'var(--text-1)', fontWeight: 700 }}>{from}–{to}</strong> trên <strong style={{ color: 'var(--text-1)', fontWeight: 700 }}>{totalFiltered.toLocaleString()}</strong> dòng</>}
          {data.length !== totalFiltered && (
            <span style={{
              display: 'inline-block', marginLeft: 8,
              padding: '2px 8px', borderRadius: 6,
              background: 'var(--warning-bg)', color: 'var(--warning-text)',
              fontSize: 11, fontWeight: 600,
            }}>lọc từ {data.length.toLocaleString()}</span>
          )}
        </span>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}
            className="data-grid-pagination-btn"
            title="Trang đầu"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: !table.getCanPreviousPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanPreviousPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !table.getCanPreviousPage() ? 0.5 : 1, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font)', lineHeight: 1, paddingBottom: 2 }}
          >
            «
          </button>
          <button
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            className="data-grid-pagination-btn"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: !table.getCanPreviousPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanPreviousPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !table.getCanPreviousPage() ? 0.5 : 1 }}
          >
            <Icon name="chevron-left" size={14} />
          </button>

          {pageNums.map((n, i) =>
            n === '...'
              ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-4)', fontSize: 13 }}>…</span>
              : <button
                  key={n}
                  onClick={() => table.setPageIndex((n as number) - 1)}
                  className={pageIndex + 1 === n ? "" : "data-grid-pagination-btn"}
                  style={{
                    minWidth: 30, height: 30, padding: '0 8px', borderRadius: 8,
                    border: pageIndex + 1 === n ? 'none' : '1px solid var(--border)',
                    background: pageIndex + 1 === n
                      ? 'linear-gradient(135deg, var(--primary), var(--primary-dark))'
                      : 'var(--card)',
                    color: pageIndex + 1 === n ? '#fff' : 'var(--text-2)',
                    fontSize: 12, fontWeight: pageIndex + 1 === n ? 800 : 600,
                    fontFamily: 'var(--font)', cursor: 'pointer',
                    boxShadow: pageIndex + 1 === n ? '0 4px 10px -4px rgba(255,107,53,0.5)' : 'none',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
          )}

          <button
            onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            className="data-grid-pagination-btn"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: !table.getCanNextPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanNextPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !table.getCanNextPage() ? 0.5 : 1 }}
          >
            <Icon name="chevron-right" size={14} />
          </button>
          <button
            onClick={() => table.setPageIndex(totalPages - 1)} disabled={!table.getCanNextPage()}
            className="data-grid-pagination-btn"
            title="Trang cuối"
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card)', color: !table.getCanNextPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanNextPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !table.getCanNextPage() ? 0.5 : 1, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font)', lineHeight: 1, paddingBottom: 2 }}
          >
            »
          </button>
        </div>

        <select
          value={pageSize}
          onChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0) }}
          style={{
            padding: '6px 28px 6px 12px', height: 30,
            borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--card)', color: 'var(--text-2)',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
            cursor: 'pointer', outline: 'none', appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / trang</option>)}
        </select>
      </div>
    </div>
  )
}
