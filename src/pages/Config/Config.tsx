import React, { useState } from 'react'
import { Button, StatusBadge, ConfirmDialog, useToast, Icon } from '../../components'
import { useQuery } from '../../hooks'
import {
  getBranches, softDeleteBranch,
  getAcademicYears, softDeleteAcademicYear, setCurrentAcademicYear,
} from '../../services'
import type { Branch, AcademicYear } from '../../types/database'
import { BranchFormModal } from './components/BranchFormModal'
import { AcademicYearFormModal } from './components/AcademicYearFormModal'

type Tab = 'branches' | 'years'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

export const Config: React.FC = () => {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('branches')

  // ── Branches ──────────────────────────────────────────────
  const { data: branchesRaw, loading: bLoad, refetch: bRefetch } = useQuery(getBranches)
  const branches = branchesRaw ?? []
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [deleteBranch, setDeleteBranch] = useState<Branch | null>(null)

  const handleDeleteBranch = async () => {
    if (!deleteBranch) return
    try {
      await softDeleteBranch(deleteBranch.id)
      toast.success(`Đã xoá cơ sở "${deleteBranch.name}"`)
      setDeleteBranch(null)
      bRefetch()
    } catch (e: any) {
      toast.error(e.message || 'Không thể xoá')
    }
  }

  // ── Academic Years ─────────────────────────────────────────
  const { data: yearsRaw, loading: yLoad, refetch: yRefetch } = useQuery(getAcademicYears)
  const years = yearsRaw ?? []
  const [showYearForm, setShowYearForm] = useState(false)
  const [editYear, setEditYear] = useState<AcademicYear | null>(null)
  const [deleteYear, setDeleteYear] = useState<AcademicYear | null>(null)
  const [settingCurrent, setSettingCurrent] = useState<string | null>(null)

  const handleDeleteYear = async () => {
    if (!deleteYear) return
    try {
      await softDeleteAcademicYear(deleteYear.id)
      toast.success(`Đã xoá năm học "${deleteYear.name}"`)
      setDeleteYear(null)
      yRefetch()
    } catch (e: any) {
      toast.error(e.message || 'Không thể xoá')
    }
  }

  const handleSetCurrent = async (year: AcademicYear) => {
    setSettingCurrent(year.id)
    try {
      await setCurrentAcademicYear(year.id)
      toast.success(`Đã đặt "${year.name}" làm năm học hiện tại`)
      yRefetch()
    } catch (e: any) {
      toast.error(e.message || 'Không thể cập nhật')
    } finally {
      setSettingCurrent(null)
    }
  }

  return (
    <div>
      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'var(--card)', borderRadius: 12, padding: 4,
        border: '1px solid var(--border)', width: 'fit-content',
        boxShadow: 'var(--shadow)',
      }}>
        {([
          { id: 'branches', label: 'Cơ sở', icon: 'map-pin' },
          { id: 'years',    label: 'Năm học', icon: 'calendar' },
        ] as { id: Tab; label: string; icon: any }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)',
              background: tab === t.id ? 'var(--primary)' : 'transparent',
              color: tab === t.id ? '#fff' : 'var(--text-3)',
              transition: 'all 0.15s',
            }}>
            <Icon name={t.icon} size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Branches ── */}
      {tab === 'branches' && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Danh sách cơ sở</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{branches.length} cơ sở</div>
            </div>
            <Button icon="plus" onClick={() => { setEditBranch(null); setShowBranchForm(true) }}>Thêm cơ sở</Button>
          </div>

          {bLoad ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              <span style={{ fontSize: 13, color: 'var(--text-4)' }}>Đang tải...</span>
            </div>
          ) : branches.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>Chưa có cơ sở nào. Nhấn "Thêm cơ sở" để tạo mới.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header)', borderBottom: '2px solid var(--border)' }}>
                  {['Mã', 'Tên cơ sở', 'Địa chỉ', 'Điện thoại', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: 6, color: 'var(--primary)' }}>{b.code}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-1)' }}>{b.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-3)' }}>{b.address || '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-3)' }}>{b.phone || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge status={b.status} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setEditBranch(b); setShowBranchForm(true) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                          <Icon name="edit" size={12} /> Sửa
                        </button>
                        <button onClick={() => setDeleteBranch(b)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                          <Icon name="trash" size={12} /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Academic Years ── */}
      {tab === 'years' && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Danh sách năm học</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{years.length} năm học</div>
            </div>
            <Button icon="plus" onClick={() => { setEditYear(null); setShowYearForm(true) }}>Thêm năm học</Button>
          </div>

          {yLoad ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              <span style={{ fontSize: 13, color: 'var(--text-4)' }}>Đang tải...</span>
            </div>
          ) : years.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>Chưa có năm học nào. Nhấn "Thêm năm học" để tạo mới.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header)', borderBottom: '2px solid var(--border)' }}>
                  {['Năm học', 'Bắt đầu', 'Kết thúc', 'Trạng thái', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {years.map(y => (
                  <tr key={y.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{y.name}</span>
                        {y.is_current && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#059669' }}>Hiện tại</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-3)' }}>{fmt(y.start_date)}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-3)' }}>{fmt(y.end_date)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {y.is_current
                        ? <span style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>✓ Đang dùng</span>
                        : <span style={{ fontSize: 11, color: 'var(--text-4)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        {!y.is_current && (
                          <button
                            onClick={() => handleSetCurrent(y)}
                            disabled={settingCurrent === y.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(16,185,129,0.4)', background: 'transparent', color: '#059669', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer', opacity: settingCurrent === y.id ? 0.5 : 1 }}>
                            <Icon name="check" size={12} /> Đặt hiện tại
                          </button>
                        )}
                        <button onClick={() => { setEditYear(y); setShowYearForm(true) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                          <Icon name="edit" size={12} /> Sửa
                        </button>
                        <button onClick={() => setDeleteYear(y)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                          <Icon name="trash" size={12} /> Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      <BranchFormModal
        open={showBranchForm}
        onClose={() => setShowBranchForm(false)}
        onSuccess={bRefetch}
        branch={editBranch}
      />

      <AcademicYearFormModal
        open={showYearForm}
        onClose={() => setShowYearForm(false)}
        onSuccess={yRefetch}
        year={editYear}
      />

      <ConfirmDialog
        open={!!deleteBranch}
        title="Xoá cơ sở"
        message={`Bạn có chắc muốn xoá cơ sở "${deleteBranch?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDeleteBranch}
        onCancel={() => setDeleteBranch(null)}
      />

      <ConfirmDialog
        open={!!deleteYear}
        title="Xoá năm học"
        message={`Bạn có chắc muốn xoá năm học "${deleteYear?.name}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDeleteYear}
        onCancel={() => setDeleteYear(null)}
      />
    </div>
  )
}

export default Config
