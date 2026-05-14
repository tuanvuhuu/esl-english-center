import React, { useState } from 'react'
import { Card, Button, Input, Select, Tabs, LoadingSpinner, EmptyState, useToast } from '../../components'
import { useQuery, useCRUDPage, useListFilter } from '../../hooks'
import { getPayments, updatePayment } from '../../services'
import { useAppContext } from '../../context/AppContext'
import { mapPayment } from '../../lib/mappers'
import { PaymentTable } from './PaymentTable'
import { PaymentGrid } from './PaymentGrid'
import { PaymentFormModal } from './PaymentFormModal'
import type { DbPayment } from '../../types/database'
import type { Payment } from '../../types/data'

type PaymentRow = { raw: DbPayment; mapped: Payment }

export const Finance: React.FC = () => {
  const toast = useToast()
  const { selectedBranch, selectedYear } = useAppContext()
  const branchId = selectedBranch?.id
  const yearId = selectedYear?.id
  const { data: raw, loading, error, refetch } = useQuery(
    () => getPayments({ branchId, academicYearId: yearId }),
    [branchId, yearId]
  )
  const rows: PaymentRow[] = (raw ?? []).map(r => ({ raw: r, mapped: mapPayment(r) }))

  const {
    state: { search, filters, viewMode, showForm },
    setSearch, setFilter, setViewMode,
    openAdd, closeForm,
  } = useCRUDPage<PaymentRow>({ status: 'all', type: 'all' })

  const [markingId, setMarkingId] = useState<string | null>(null)

  const filtered = useListFilter(rows, search, filters, {
    searchKeys: [
      r => r.mapped.student,
      r => r.raw.class?.name ?? '',
    ],
    filterMap: {
      status: r => r.mapped.status,
      type:   r => r.raw.type ?? '',
    },
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
      toast.success('Đã đánh dấu đã thu')
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Cập nhật thất bại')
    } finally {
      setMarkingId(null)
    }
  }

  const viewTabs = (
    <Tabs
      tabs={[
        { id: 'table', label: '☰', tooltip: 'Dạng bảng' },
        { id: 'grid',  label: '⊞', tooltip: 'Dạng lưới' },
      ]}
      active={viewMode}
      onChange={v => setViewMode(v as 'table' | 'grid')}
    />
  )

  return (
    <div>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-1)' }}>Quản lý tài chính</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{`${rows.length} phiếu thu`}</div>
          </div>
          <Button icon="plus" onClick={openAdd}>Tạo phiếu thu</Button>
        </div>
      )}

      {viewMode === 'grid' && (
        <Card animate style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input placeholder="Tìm theo học viên, lớp..." value={search} onChange={setSearch} icon="search" />
            </div>
            <Select value={filters.status} onChange={v => setFilter('status', v)}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'paid', label: 'Đã thu' },
                { value: 'pending', label: 'Chờ thu' },
                { value: 'overdue', label: 'Quá hạn' },
              ]}
              style={{ minWidth: 140 }}
            />
            <Select value={filters.type} onChange={v => setFilter('type', v)}
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

      {error ? (
        <EmptyState title="Lỗi tải dữ liệu" desc={error.message} />
      ) : viewMode === 'table' ? (
        <PaymentTable
          rows={rows}
          subtitle={`${rows.length} phiếu thu`}
          onMarkPaid={handleMarkPaid}
          markingId={markingId}
          actions={viewTabs}
          onAdd={openAdd}
          onRefresh={refetch}
          loading={loading}
        />
      ) : loading ? (
        <LoadingSpinner />
      ) : (
        <PaymentGrid rows={filtered} onMarkPaid={handleMarkPaid} markingId={markingId} />
      )}

      <PaymentFormModal open={showForm} onClose={closeForm} onSuccess={refetch} />
    </div>
  )
}

export default Finance
