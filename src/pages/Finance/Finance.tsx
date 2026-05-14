import React, { useState } from 'react'
import { Card, Button, PageHeader, Input, Select, Tabs, LoadingSpinner, EmptyState } from '../../components'
import { useQuery } from '../../hooks'
import { getPayments, updatePayment } from '../../services'
import { mapPayment } from '../../lib/mappers'
import { PaymentTable } from './PaymentTable'
import { PaymentGrid } from './PaymentGrid'
import { PaymentFormModal } from './PaymentFormModal'

export const Finance: React.FC = () => {
  const { data: raw, loading, error, refetch } = useQuery(getPayments)

  const rows = (raw ?? []).map(r => ({ raw: r, mapped: mapPayment(r) }))

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [showForm, setShowForm] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const filtered = rows.filter(({ raw: r, mapped: p }) => {
    const ms = p.student.toLowerCase().includes(search.toLowerCase()) ||
               r.class?.name?.toLowerCase().includes(search.toLowerCase())
    const mf = filterStatus === 'all' || p.status === filterStatus
    const mt = filterType === 'all' || r.type === filterType
    return ms && mf && mt
  })

  const paid    = rows.filter(r => r.mapped.status === 'paid')
  const pending = rows.filter(r => r.mapped.status === 'pending' || r.mapped.status === 'overdue')
  const totalPaid    = paid.reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0)
  const totalPending = pending.reduce((s, r) => s + (typeof r.mapped.amount === 'number' ? r.mapped.amount : 0), 0)

  const stats = [
    { label: 'Tổng thu',   value: totalPaid.toLocaleString('vi-VN') + 'đ',    color: 'var(--success)', sub: `${paid.length} phiếu đã thu` },
    { label: 'Công nợ',    value: totalPending.toLocaleString('vi-VN') + 'đ', color: 'var(--warning)', sub: `${pending.length} HV chưa đóng` },
    { label: 'Tổng phiếu', value: String(rows.length),                        color: 'var(--info)',    sub: 'phiếu thu' },
  ]

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id)
    try {
      await updatePayment(id, { status: 'paid', payment_date: new Date().toISOString().split('T')[0] })
      refetch()
    } finally {
      setMarkingId(null)
    }
  }

  const viewTabs = (
    <Tabs tabs={[{ id: 'table', label: '☰' }, { id: 'grid', label: '⊞' }]} active={viewMode} onChange={setViewMode} />
  )

  return (
    <div>
      <PageHeader
        title="Quản lý tài chính"
        subtitle={`${rows.length} phiếu thu`}
        actions={viewMode === 'grid' ? <Button icon="plus" onClick={() => setShowForm(true)}>Tạo phiếu thu</Button> : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} animate delay={i * 70} style={{ borderLeft: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo học viên, lớp..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'paid', label: 'Đã thu' },
                { value: 'pending', label: 'Chờ thu' },
                { value: 'overdue', label: 'Quá hạn' },
              ]}
              style={{ minWidth: 140 }}
            />
            <Select
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'all', label: 'Tất cả loại' },
                { value: 'tuition', label: 'Học phí' },
                { value: 'material', label: 'Học liệu' },
                { value: 'exam_fee', label: 'Phí thi' },
                { value: 'other', label: 'Khác' },
              ]}
              style={{ minWidth: 130 }}
            />
            {viewTabs}
          </div>
        </Card>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <PaymentTable
          rows={rows}
          subtitle={`${rows.length} phiếu thu`}
          onMarkPaid={handleMarkPaid}
          markingId={markingId}
          actions={viewTabs}
          onAdd={() => setShowForm(true)}
          onRefresh={refetch}
        />
      ) : (
        <PaymentGrid rows={filtered} onMarkPaid={handleMarkPaid} markingId={markingId} />
      )}

      <PaymentFormModal open={showForm} onClose={() => setShowForm(false)} onSuccess={refetch} />
    </div>
  )
}

export default Finance
