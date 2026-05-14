import React from 'react'
import { Card, Icon } from '../../../components'
import type { IconName } from '../../../components'

/* ─── Date range presets ─── */
export type RangePreset = 'thisweek' | 'thismonth' | 'thisquarter' | 'thisyear' | 'last30' | 'last90' | 'all'

export const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'thisweek',    label: 'Tuần này' },
  { value: 'thismonth',   label: 'Tháng này' },
  { value: 'thisquarter', label: 'Quý này' },
  { value: 'thisyear',    label: 'Năm này' },
  { value: 'last30',      label: '30 ngày qua' },
  { value: 'last90',      label: '90 ngày qua' },
  { value: 'all',         label: 'Tất cả' },
]

export const getDateRange = (preset: RangePreset): { from: Date; to: Date } | null => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  switch (preset) {
    case 'thisweek': {
      const day = now.getDay()
      const start = new Date(now)
      start.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
      start.setHours(0, 0, 0, 0)
      return { from: start, to: today }
    }
    case 'thismonth':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: today }
    case 'thisquarter': {
      const q = Math.floor(now.getMonth() / 3)
      return { from: new Date(now.getFullYear(), q * 3, 1), to: today }
    }
    case 'thisyear':
      return { from: new Date(now.getFullYear(), 0, 1), to: today }
    case 'last30': {
      const from = new Date(today); from.setDate(today.getDate() - 30); from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
    case 'last90': {
      const from = new Date(today); from.setDate(today.getDate() - 90); from.setHours(0, 0, 0, 0)
      return { from, to: today }
    }
    case 'all':
      return null
  }
}

export const inRange = (dateStr: string | null | undefined, range: { from: Date; to: Date } | null): boolean => {
  if (!range) return true
  if (!dateStr) return false
  const d = new Date(dateStr)
  return d >= range.from && d <= range.to
}

/* ─── Formatting ─── */
export const VND_SHORT = (n: number): string => {
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + ' tỷ'
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + ' tr'
  if (n >= 1e3) return Math.round(n / 1e3) + 'k'
  return n.toLocaleString('vi-VN')
}

export const fmtPct = (n: number): string => `${Math.round(n)}%`

export const monthLabel = (d: Date) => `T${d.getMonth() + 1}`
export const monthKey   = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
export const addMonths  = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x }

/* ─── KPI stat card ─── */
interface KpiStatProps {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  icon: IconName
  color: string
  bg: string
  delay?: number
}
export const KpiStat: React.FC<KpiStatProps> = ({ label, value, sub, icon, color, bg, delay = 0 }) => (
  <Card animate delay={delay} hover style={{ padding: 14, minHeight: 96 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </span>
      <div style={{
        width: 28, height: 28, borderRadius: 8, background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={14} style={{ color }} />
      </div>
    </div>
    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '-0.5px' }}>
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>
    )}
  </Card>
)

/* ─── Section header ─── */
export const SectionHeader: React.FC<{
  title: string
  subtitle?: string
  icon?: IconName
  iconColor?: string
  right?: React.ReactNode
}> = ({ title, subtitle, icon, iconColor, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      {icon && (
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'var(--hover-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} style={{ color: iconColor ?? 'var(--text-3)' }} />
        </div>
      )}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
    {right}
  </div>
)

/* ─── Simple bar chart row (horizontal) ─── */
export interface HBarRow {
  label: string
  value: number
  max: number
  color: string
  sub?: string
}
export const HorizontalBars: React.FC<{ rows: HBarRow[]; height?: number; labelWidth?: number }> = ({
  rows, height = 22, labelWidth = 120,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {rows.map((r, i) => {
      const pct = r.max > 0 ? (r.value / r.max) * 100 : 0
      return (
        <div key={r.label + i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: labelWidth, fontSize: 12, color: 'var(--text-2)', fontWeight: 500,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {r.label}
          </div>
          <div style={{ flex: 1, height, background: 'var(--hover-bg)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${pct}%`, background: r.color, borderRadius: 6,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
            <span style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              fontSize: 11, fontWeight: 700, color: 'var(--text-1)',
            }}>
              {r.sub ?? r.value}
            </span>
          </div>
        </div>
      )
    })}
  </div>
)

/* ─── CSV exporter helper ─── */
export const exportCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const escape = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = '﻿' + [headers, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` })
  a.click()
  URL.revokeObjectURL(url)
}
