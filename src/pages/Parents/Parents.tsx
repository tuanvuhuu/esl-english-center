import React, { useMemo, useEffect } from 'react'
import { DataGrid, Avatar, Icon, ConfirmDialog, useToast } from '../../components'
import type { DataGridColumn } from '../../components'
import { useQuery, useCRUDPage } from '../../hooks'
import { getParents, softDeleteParent } from '../../services'
import { initials } from '../../lib/mappers'
import type { DbParent } from '../../services/parents'
import { ParentFormModal } from './components/ParentFormModal'
import { ParentDetail } from './components/ParentDetail'

const RELATION_LABEL: Record<string, string> = {
  father: 'Bố', mother: 'Mẹ', grandfather: 'Ông', grandmother: 'Bà',
  guardian: 'Người giám hộ', other: 'Khác',
}
const RELATION_COLOR: Record<string, string> = {
  father: '#2563eb', mother: '#ec4899', grandfather: '#0ea5e9',
  grandmother: '#d946ef', guardian: '#16a34a', other: '#6b7280',
}

interface ParentsProps {
  params?: {
    search?: string;
    tab?: 'info' | 'history';
  };
  onNavigate?: (page: string, params?: any) => void;
}

export const Parents: React.FC<ParentsProps> = ({ params, onNavigate }) => {
  const toast = useToast()
  const { data: parents, loading, refetch } = useQuery(getParents)

  const {
    state: { showForm, editItem, detailItem, deleteTarget },
    openAdd, openEdit, closeForm,
    setDetail, setDeleteTarget,
  } = useCRUDPage<DbParent>()

  useEffect(() => {
    if (params?.search && parents && parents.length > 0) {
      const q = params.search.toLowerCase()
      const match = parents.find(p => p.full_name.toLowerCase() === q) || 
                    parents.find(p => p.full_name.toLowerCase().includes(q))
      if (match) {
        setDetail(match)
      }
    }
  }, [params?.search, parents, setDetail])

  const all = useMemo(() => {
    let list = parents ?? []
    if (params?.search) {
      const q = params.search.toLowerCase()
      list = list.filter(
        p =>
          p.full_name.toLowerCase().includes(q) ||
          (p.student_parents ?? []).some(sp => sp.student?.full_name?.toLowerCase().includes(q))
      )
    }
    return list
  }, [parents, params])

  /* Aggregate stats */
  const totalLinks = useMemo(() => all.reduce((s, p) => s + (p.student_parents?.length ?? 0), 0), [all])
  const withChildren = all.filter(p => (p.student_parents?.length ?? 0) > 0).length
  const orphanCount = all.length - withChildren

  /* Delete */
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await softDeleteParent(deleteTarget.id)
      toast.success(`Đã xoá phụ huynh "${deleteTarget.full_name}"`)
      refetch()
      setDeleteTarget(null)
      if (detailItem?.id === deleteTarget.id) setDetail(null)
    } catch (e: any) {
      toast.error('Không xoá được: ' + e.message)
    }
  }

  /* Columns */
  const columns: DataGridColumn<DbParent>[] = [
    {
      key: 'name',
      title: 'Họ tên',
      filterable: true,
      filterValue: r => r.full_name,
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={initials(r.full_name)} size={32} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>
              {r.gender === 'M' ? 'Nam' : r.gender === 'F' ? 'Nữ' : '—'}
              {r.occupation && ` · ${r.occupation}`}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'SĐT',
      filterable: true,
      isAllowCopy: true,
      filterValue: r => r.phone,
      render: r => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.phone}</div>
          {r.phone_secondary && (
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{r.phone_secondary}</div>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      title: 'Email',
      filterable: true,
      isAllowCopy: true,
      filterValue: r => r.email ?? '',
      render: r => r.email
        ? <span style={{ color: 'var(--text-2)' }}>{r.email}</span>
        : <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>—</span>,
    },
    {
      key: 'address',
      title: 'Địa chỉ',
      filterable: true,
      filterValue: r => r.address ?? '',
      render: r => r.address
        ? <span style={{ color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: 200 }}>{r.address}</span>
        : <span style={{ color: 'var(--text-4)' }}>—</span>,
    },
    {
      key: 'students',
      title: 'Học viên',
      width: 230,
      sortable: false,
      filterable: true,
      filterValue: r => (r.student_parents ?? []).map(sp => sp.student?.full_name ?? '').join(' '),
      render: r => {
        const links = r.student_parents ?? []
        if (links.length === 0) {
          return <span style={{ color: 'var(--text-4)', fontStyle: 'italic', fontSize: 12 }}>Chưa liên kết</span>
        }
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {links.slice(0, 2).map(link => {
              const s = link.student
              if (!s) return null
              const c = RELATION_COLOR[link.relation] ?? '#6b7280'
              return (
                <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  {link.is_primary && <Icon name="star" size={10} style={{ color: '#f59e0b' }} />}
                  <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{s.full_name}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 99,
                    background: c + '20', color: c, fontWeight: 700,
                  }}>
                    {RELATION_LABEL[link.relation] ?? link.relation}
                  </span>
                </div>
              )
            })}
            {links.length > 2 && (
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                +{links.length - 2} học viên khác
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: '_actions',
      title: '',
      width: 90,
      sortable: false,
      render: r => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <button
            onClick={e => { e.stopPropagation(); openEdit(r) }}
            title="Chỉnh sửa"
            style={iconBtn()}
          >
            <Icon name="edit" size={12} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setDeleteTarget(r) }}
            title="Xoá"
            style={{ ...iconBtn(), color: '#dc2626' }}
          >
            <Icon name="trash" size={12} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 14 }}>
        <StatPill icon="user"    color="#FF6B35" bg="var(--primary-light)" label="Tổng phụ huynh"   value={all.length} />
        <StatPill icon="users"   color="#16a34a" bg="#dcfce7"              label="Có con đang học"  value={withChildren} />
        <StatPill icon="message" color="#2563eb" bg="#dbeafe"              label="Liên kết HV-PH"   value={totalLinks} />
        <StatPill icon="alert"   color="#d97706" bg="#fef3c7"              label="Chưa có con"      value={orphanCount} />
      </div>

      <DataGrid<DbParent>
        title="Danh sách phụ huynh"
        subtitle={`${all.length} phụ huynh`}
        data={all}
        columns={columns}
        rowKey={r => r.id}
        loading={loading}
        defaultPageSize={20}
        emptyText="Chưa có phụ huynh nào"
        onAdd={openAdd}
        addLabel="Thêm phụ huynh"
        onRefresh={refetch}
        onRowClick={setDetail}
        exportFilename="phu-huynh"
      />

      <ParentDetail
        parent={detailItem}
        onClose={() => { setDetail(null); onNavigate?.('parents', null); }}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        defaultTab={params?.tab}
      />

      <ParentFormModal
        open={showForm}
        onClose={closeForm}
        onSuccess={refetch}
        parent={editItem}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xoá phụ huynh"
        message={
          deleteTarget && (deleteTarget.student_parents?.length ?? 0) > 0
            ? `Phụ huynh "${deleteTarget.full_name}" đang liên kết với ${deleteTarget.student_parents?.length} học viên. Bạn có chắc muốn xoá? Liên kết với học viên sẽ vẫn còn nhưng phụ huynh sẽ ẩn khỏi danh sách.`
            : `Bạn có chắc muốn xoá phụ huynh "${deleteTarget?.full_name}"?`
        }
        confirmLabel="Xoá"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

const iconBtn = (): React.CSSProperties => ({
  width: 28, height: 26, border: 'none', borderRadius: 6,
  background: 'var(--hover-bg)', color: 'var(--text-3)',
  cursor: 'pointer', display: 'inline-flex',
  alignItems: 'center', justifyContent: 'center',
})

const StatPill: React.FC<{ icon: any; color: string; bg: string; label: string; value: number }> = ({
  icon, color, bg, label, value,
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    background: 'var(--card)', border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={17} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{label}</div>
    </div>
  </div>
)

export default Parents
