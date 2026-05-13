import React, { useState, useMemo } from 'react'
import { Icon } from './Icon'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DataGridColumn<T = any> {
  key: string
  title: string
  render?: (row: T, idx: number) => React.ReactNode
  filterable?: boolean
  filterType?: 'text' | 'select'
  filterOptions?: { value: string; label: string }[]
  filterValue?: (row: T) => string      // override what value to filter on
  width?: number | string
  align?: 'left' | 'center' | 'right'
  noWrap?: boolean
}

interface DataGridProps<T = any> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  columns: DataGridColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  onRowClick?: (row: T) => void
  loading?: boolean
  defaultPageSize?: number
  exportFilename?: string
  emptyText?: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZES = [10, 20, 50, 100]

// ─── Sub-components ──────────────────────────────────────────────────────────

const FilterInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <div style={{ position: 'relative' }}>
    <Icon name="search" size={11} style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} />
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? ''}
      style={{
        width: '100%', padding: '4px 6px 4px 22px',
        border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 11, fontFamily: 'var(--font)',
        background: 'var(--input-bg)', color: 'var(--text-1)',
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => (e.target.style.borderColor = 'var(--primary)')}
      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
    />
    {value && (
      <button onClick={() => onChange('')}
        style={{ position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 0, lineHeight: 1 }}>
        ×
      </button>
    )}
  </div>
)

const FilterSelect: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }> = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%', padding: '4px 6px',
      border: '1px solid var(--border)', borderRadius: 6,
      fontSize: 11, fontFamily: 'var(--font)',
      background: 'var(--input-bg)', color: 'var(--text-1)',
      outline: 'none', cursor: 'pointer',
    }}
  >
    <option value="">Tất cả</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

const PageButton: React.FC<{ page: number; active?: boolean; onClick: () => void }> = ({ page, active, onClick }) => (
  <button onClick={onClick}
    style={{
      minWidth: 28, height: 28, padding: '0 6px', borderRadius: 7,
      border: active ? 'none' : '1px solid var(--border)',
      background: active ? 'var(--primary)' : 'transparent',
      color: active ? '#fff' : 'var(--text-3)',
      fontSize: 12, fontWeight: active ? 700 : 400,
      fontFamily: 'var(--font)', cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
    {page}
  </button>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export function DataGrid<T = any>({
  title, subtitle, actions,
  columns, data, rowKey,
  onRowClick, loading,
  defaultPageSize = 20,
  exportFilename = 'export',
  emptyText = 'Không có dữ liệu',
}: DataGridProps<T>) {
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const setFilter = (key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val }))
    setPage(1)
  }

  const filtered = useMemo(() => {
    return data.filter(row =>
      columns.every(col => {
        const val = filters[col.key]
        if (!val) return true
        const raw = col.filterValue ? col.filterValue(row) : String((row as any)[col.key] ?? '')
        return raw.toLowerCase().includes(val.toLowerCase())
      })
    )
  }, [data, filters, columns])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const curPage = Math.min(page, totalPages)
  const pageData = filtered.slice((curPage - 1) * pageSize, curPage * pageSize)

  const activeFilters = Object.values(filters).filter(Boolean).length

  // CSV export (raw values only)
  const handleExport = () => {
    const header = columns.map(c => `"${c.title}"`).join(',')
    const body = filtered.map(row =>
      columns.map(col => {
        const v = col.filterValue ? col.filterValue(row) : String((row as any)[col.key] ?? '')
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

  const hasFilterRow = columns.some(c => c.filterable)

  // Build visible page numbers
  const pageNums: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pageNums.push(i)
  } else {
    pageNums.push(1)
    if (curPage > 3) pageNums.push('...')
    for (let i = Math.max(2, curPage - 1); i <= Math.min(totalPages - 1, curPage + 1); i++) pageNums.push(i)
    if (curPage < totalPages - 2) pageNums.push('...')
    pageNums.push(totalPages)
  }

  return (
    <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)', gap: 12 }}>
        <div style={{ flex: 1 }}>
          {title && <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>}
          {subtitle && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {activeFilters > 0 && (
            <button onClick={() => { setFilters({}); setPage(1) }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--warning)', background: 'rgba(245,158,11,0.08)', color: '#b45309', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer' }}>
              <Icon name="x" size={11} /> Xoá lọc ({activeFilters})
            </button>
          )}
          <button onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--hover-bg)', color: 'var(--text-2)', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          >
            <Icon name="download" size={12} /> Export CSV
          </button>
          {actions}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            {/* Column headers */}
            <tr style={{ background: 'var(--table-header)', borderBottom: hasFilterRow ? 'none' : '1px solid var(--border)' }}>
              {columns.map(col => (
                <th key={col.key} style={{
                  padding: '10px 14px', textAlign: col.align ?? 'left',
                  fontWeight: 600, color: 'var(--text-3)', fontSize: 11,
                  whiteSpace: 'nowrap', width: col.width,
                  userSelect: 'none',
                }}>
                  {col.title}
                </th>
              ))}
            </tr>
            {/* Filter row */}
            {hasFilterRow && (
              <tr style={{ background: 'var(--table-header)', borderBottom: '1px solid var(--border)' }}>
                {columns.map(col => (
                  <th key={col.key} style={{ padding: '5px 8px', fontWeight: 'normal' }}>
                    {col.filterable && (
                      col.filterType === 'select' && col.filterOptions
                        ? <FilterSelect value={filters[col.key] ?? ''} onChange={v => setFilter(col.key, v)} options={col.filterOptions} />
                        : <FilterInput value={filters[col.key] ?? ''} onChange={v => setFilter(col.key, v)} placeholder={`Lọc...`} />
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ fontSize: 12 }}>Đang tải...</span>
                  </div>
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)', fontSize: 12 }}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={rowKey(row)}
                  onClick={() => onRowClick?.(row)}
                  style={{ borderBottom: '1px solid var(--border-light)', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.12s' }}
                  onMouseEnter={e => { if (onRowClick) (e.currentTarget as HTMLElement).style.background = 'var(--table-row-hover)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  {columns.map(col => (
                    <td key={col.key} style={{
                      padding: '10px 14px',
                      textAlign: col.align ?? 'left',
                      color: 'var(--text-2)',
                      whiteSpace: col.noWrap ? 'nowrap' : undefined,
                      verticalAlign: 'middle',
                    }}>
                      {col.render
                        ? col.render(row, (curPage - 1) * pageSize + idx)
                        : String((row as any)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderTop: '1px solid var(--border)', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
          {filtered.length === 0 ? '0 kết quả' : `${(curPage - 1) * pageSize + 1}–${Math.min(curPage * pageSize, filtered.length)} / ${filtered.length} dòng`}
          {data.length !== filtered.length && <span style={{ color: 'var(--warning)', marginLeft: 6 }}>(đang lọc từ {data.length})</span>}
        </span>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={curPage === 1}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: curPage === 1 ? 'var(--text-4)' : 'var(--text-2)', cursor: curPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-left" size={13} />
          </button>

          {pageNums.map((n, i) =>
            n === '...'
              ? <span key={`e${i}`} style={{ padding: '0 4px', color: 'var(--text-4)', fontSize: 12 }}>…</span>
              : <PageButton key={n} page={n} active={n === curPage} onClick={() => setPage(n)} />
          )}

          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={curPage === totalPages}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: curPage === totalPages ? 'var(--text-4)' : 'var(--text-2)', cursor: curPage === totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chevron-right" size={13} />
          </button>
        </div>

        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
          style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-2)', fontSize: 11, fontFamily: 'var(--font)', cursor: 'pointer', outline: 'none' }}>
          {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / trang</option>)}
        </select>
      </div>
    </div>
  )
}
