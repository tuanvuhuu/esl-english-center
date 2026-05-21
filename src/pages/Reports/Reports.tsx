import React, { useState } from 'react'
import { PageHeader, Card, Icon } from '../../components'
import { OverviewReport }   from './components/OverviewReport'
import { StudentReport }    from './components/StudentReport'
import { FinanceReport }    from './components/FinanceReport'
import { AttendanceReport } from './components/AttendanceReport'
import { AcademicReport }   from './components/AcademicReport'
import { TeacherReport }    from './components/TeacherReport'
import { RANGE_OPTIONS, type RangePreset } from './components/reportShared'
import type { IconName } from '../../components'

type TabId = 'overview' | 'student' | 'finance' | 'attendance' | 'academic' | 'teacher'

interface TabDef {
  id: TabId
  label: string
  icon: IconName
  color: string
  bg: string
}

const TABS: TabDef[] = [
  { id: 'overview',   label: 'Tổng hợp',  icon: 'dashboard',  color: 'var(--primary)', bg: 'var(--primary-light)' },
  { id: 'student',    label: 'Học viên',  icon: 'users',      color: 'var(--primary)', bg: 'var(--primary-light)' },
  { id: 'finance',    label: 'Tài chính', icon: 'wallet',     color: 'var(--success-dark)', bg: 'var(--success-light)' },
  { id: 'attendance', label: 'Điểm danh', icon: 'clipboard',  color: 'var(--info-dark)', bg: 'var(--info-light)' },
  { id: 'academic',   label: 'Học tập',   icon: 'star',       color: 'var(--academic-dark)', bg: 'var(--academic-light)' },
  { id: 'teacher',    label: 'Giáo viên', icon: 'graduation', color: 'var(--warning-dark)', bg: 'var(--warning-light)' },
]

export const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [range, setRange] = useState<RangePreset>('thismonth')

  return (
    <div>
      <PageHeader
        title="Báo cáo & Thống kê"
        subtitle="Tổng quan dữ liệu trung tâm theo nhiều góc nhìn"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 4px 0 12px', height: 36, borderRadius: 9, border: '1.5px solid var(--border)', background: 'var(--card)' }}>
              <Icon name="calendar" size={13} style={{ color: 'var(--text-4)' }} />
              <select
                value={range}
                onChange={e => setRange(e.target.value as RangePreset)}
                style={{
                  height: 32, border: 'none', background: 'transparent',
                  color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font)',
                  outline: 'none', cursor: 'pointer', paddingRight: 8,
                }}
              >
                {RANGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        }
      />

      {/* Tab strip */}
      <Card animate style={{ padding: 6, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {TABS.map(t => {
            const active = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 8,
                  border: 'none', cursor: 'pointer',
                  background: active ? t.bg : 'transparent',
                  color: active ? t.color : 'var(--text-3)',
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  fontFamily: 'var(--font)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--hover-bg)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <Icon name={t.icon} size={14} />
                {t.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Active tab content */}
      {activeTab === 'overview'   && <OverviewReport   range={range} onJump={id => setActiveTab(id as TabId)} />}
      {activeTab === 'student'    && <StudentReport    range={range} />}
      {activeTab === 'finance'    && <FinanceReport    range={range} />}
      {activeTab === 'attendance' && <AttendanceReport range={range} />}
      {activeTab === 'academic'   && <AcademicReport   range={range} />}
      {activeTab === 'teacher'    && <TeacherReport    range={range} />}
    </div>
  )
}

export default Reports
