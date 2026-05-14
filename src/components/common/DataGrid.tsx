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

// ─── Sub-components ──────────────────────────────────────────────────────────

const IndeterminateCheckbox: React.FC<{
  checked?: boolean
  indeterminate?: boolean
  onChange?: React.ChangeEventHandler<HTMLInputElement>
  onClick?: React.MouseEventHandler<HTMLInputElement>
  disabled?: boolean
}> = ({ checked, indeterminate, onChange, onClick, disabled }) => {
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate)
  }, [indeterminate])
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      disabled={disabled}
      style={{ cursor: disabled ? 'not-allowed' : 'pointer', accentColor: 'var(--primary)', width: 14, height: 14 }}
    />
  )
}

const FilterInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div style={{ position: 'relative', marginTop: 5 }}>
    <Icon
      name="filter"
      size={10}
      style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: value ? 'var(--primary)' : 'var(--text-4)', pointerEvents: 'none' }}
    />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder=""
      style={{
        width: '100%', height: 24,
        padding: value ? '0 20px 0 22px' : '0 8px 0 22px',
        border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 5, fontSize: 11, fontFamily: 'var(--font)',
        background: value ? 'var(--primary-light)' : 'var(--input-bg)',
        color: 'var(--text-1)', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.target.style.borderColor = value ? 'var(--primary)' : 'var(--border)')}
    />
    {value && (
      <button
        onClick={() => onChange('')}
        style={{
          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-4)', padding: 0, lineHeight: 1, fontSize: 14,
        }}
      >×</button>
    )}
  </div>
)

const FilterSelect: React.FC<{
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', height: 24, marginTop: 5,
      padding: '0 6px',
      border: `1px solid ${value ? 'var(--primary)' : 'var(--border)'}`,
      borderRadius: 5, fontSize: 11, fontFamily: 'var(--font)',
      background: value ? 'var(--primary-light)' : 'var(--input-bg)',
      color: 'var(--text-1)', outline: 'none', cursor: 'pointer',
      transition: 'border-color 0.15s, background 0.15s',
    }}
  >
    <option value="">Tất cả</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

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

  // Sticky styles for pinned columns — header cells need extra top offset for thead sticky
  const getPinnedStyle = (column: any, isHeader = false): React.CSSProperties => {
    const pinned = column.getIsPinned()
    if (!pinned) return {}
    return {
      position: 'sticky',
      left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
      right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
      zIndex: isHeader ? 4 : 1,
      background: 'var(--card)',
      boxShadow: pinned === 'left'
        ? '2px 0 6px -2px rgba(0,0,0,0.08)'
        : '-2px 0 6px -2px rgba(0,0,0,0.08)',
    }
  }

  const headerGroups = table.getHeaderGroups()

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Card Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {selectedCount > 0 && (
            <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, padding: '4px 10px', background: 'var(--primary-light)', borderRadius: 8 }}>
              {selectedCount} đã chọn
            </span>
          )}
          {activeFilters > 0 && (
            <button
              onClick={() => { setColumnFilters([]); table.setPageIndex(0) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--warning)', background: 'rgba(245,158,11,0.08)', color: '#b45309', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer' }}
            >
              <Icon name="x" size={11} /> Xoá lọc ({activeFilters})
            </button>
          )}

          {/* Divider before action buttons */}
          {(onRefresh || onAdd || actions) && (
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />
          )}

          {actions}

          {onAdd && (
            <button
              onClick={onAdd}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 30, borderRadius: 8, border: 'none', background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer', transition: 'opacity 0.15s', flexShrink: 0 }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.88')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
            >
              <Icon name="plus" size={13} /> {addLabel}
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Làm mới"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--hover-bg)', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
            >
              <Icon name="refresh" size={13} />
            </button>
          )}

          <button
            onClick={handleExport}
            title="Export CSV"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--hover-bg)', color: 'var(--text-2)', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <Icon name="download" size={13} />
          </button>
        </div>
      </div>

      {/* ── Scrollable Table Area ── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight, flexShrink: 1 }}>
        <table style={{ minWidth: '100%', width: table.getTotalSize(), borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr
                key={headerGroup.id}
                style={{ background: 'var(--table-header)', borderBottom: '2px solid var(--border)', position: 'sticky', top: 0, zIndex: 2 }}
              >
                {headerGroup.headers.map(header => {
                  const colDef = columns.find(c => c.key === header.column.id)
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  const filterVal = (header.column.getFilterValue() as string) ?? ''
                  return (
                    <th
                      key={header.id}
                      style={{
                        width: header.getSize(),
                        padding: hasFilterRow ? '8px 10px 6px' : '10px 14px',
                        textAlign: colDef?.align ?? 'left',
                        fontWeight: 600, color: 'var(--text-3)', fontSize: 11,
                        whiteSpace: 'nowrap', userSelect: 'none',
                        position: 'relative',
                        verticalAlign: 'top',
                        background: 'var(--table-header)',
                        ...getPinnedStyle(header.column, true),
                      }}
                    >
                      {/* Title row with sort */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: canSort ? 'pointer' : 'default', marginBottom: colDef?.filterable ? 0 : 0 }}
                        onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span style={{ color: sorted ? 'var(--primary)' : 'var(--border)', fontSize: 9, lineHeight: 1, flexShrink: 0 }}>
                            {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅'}
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
                          style={{
                            position: 'absolute', right: 0, top: 0, height: '100%', width: 4,
                            cursor: 'col-resize', userSelect: 'none', touchAction: 'none',
                            background: header.column.getIsResizing() ? 'var(--primary)' : 'transparent',
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
                <td colSpan={tanstackColumns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={tanstackColumns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)' }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background 0.12s',
                    background: row.getIsSelected() ? 'var(--primary-light)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!row.getIsSelected()) (e.currentTarget as HTMLElement).style.background = 'var(--table-row-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = row.getIsSelected() ? 'var(--primary-light)' : 'transparent' }}
                >
                  {row.getVisibleCells().map(cell => {
                    const colDef = columns.find(c => c.key === cell.column.id)
                    return (
                      <td
                        key={cell.id}
                        className="grid-cell"
                        style={{
                          padding: '9px 10px',
                          textAlign: colDef?.align ?? 'left',
                          color: 'var(--text-2)',
                          whiteSpace: colDef?.noWrap ? 'nowrap' : undefined,
                          verticalAlign: 'middle',
                          width: cell.column.getSize(),
                          position: 'relative',
                          ...getPinnedStyle(cell.column),
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: '1px solid var(--border)', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {totalFiltered === 0 ? '0 kết quả' : `${from}–${to} / ${totalFiltered} dòng`}
          {data.length !== totalFiltered && (
            <span style={{ color: 'var(--warning)', marginLeft: 6 }}>(đang lọc từ {data.length})</span>
          )}
        </span>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: !table.getCanPreviousPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanPreviousPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevron-left" size={13} />
          </button>

          {pageNums.map((n, i) =>
            n === '...'
              ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-4)', fontSize: 12 }}>…</span>
              : <button
                  key={n}
                  onClick={() => table.setPageIndex((n as number) - 1)}
                  style={{
                    minWidth: 28, height: 28, padding: '0 6px', borderRadius: 7,
                    border: pageIndex + 1 === n ? 'none' : '1px solid var(--border)',
                    background: pageIndex + 1 === n ? 'var(--primary)' : 'transparent',
                    color: pageIndex + 1 === n ? '#fff' : 'var(--text-3)',
                    fontSize: 12, fontWeight: pageIndex + 1 === n ? 700 : 400,
                    fontFamily: 'var(--font)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {n}
                </button>
          )}

          <button
            onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: !table.getCanNextPage() ? 'var(--text-4)' : 'var(--text-2)', cursor: !table.getCanNextPage() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="chevron-right" size={13} />
          </button>
        </div>

        <select
          value={pageSize}
          onChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0) }}
          style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font)', cursor: 'pointer', outline: 'none' }}
        >
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / trang</option>)}
        </select>
      </div>
    </div>
  )
}
