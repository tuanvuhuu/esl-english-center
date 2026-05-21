import React, { useState } from 'react'
import { Button, StatusBadge, ConfirmDialog, useToast, Icon, Card, Input, Modal } from '../../components'
import { useQuery } from '../../hooks'
import {
  getBranches, softDeleteBranch,
  getAcademicYears, softDeleteAcademicYear, setCurrentAcademicYear,
  getAttendancePolicy,
  getStudentLevels, createStudentLevel, updateStudentLevel, softDeleteStudentLevel, type StudentLevel
} from '../../services'
import type { Branch, AcademicYear } from '../../types/database'
import { BranchFormModal } from './components/BranchFormModal'
import { AcademicYearFormModal } from './components/AcademicYearFormModal'
import { SettingToggle } from '../Settings/components/SettingToggle'

type Tab = 'branches' | 'years' | 'levels' | 'attendance'

const fmt = (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—'

export const Config: React.FC = () => {
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('branches')
  const [policy, setPolicy] = useState(() => getAttendancePolicy())

  // ── Levels ─────────────────────────────────────────────────
  const { data: levelsRaw, loading: lLoad, refetch: lRefetch } = useQuery(getStudentLevels)
  const levels = levelsRaw ?? []
  const [showLevelForm, setShowLevelForm] = useState(false)
  const [editLevel, setEditLevel] = useState<StudentLevel | null>(null) // null = add new
  const [levelVal, setLevelVal] = useState('')
  const [levelLabel, setLevelLabel] = useState('')
  const [deleteLevel, setDeleteLevel] = useState<StudentLevel | null>(null)
  const [levelSaving, setLevelSaving] = useState(false)

  const handleOpenLevelAdd = () => {
    setEditLevel(null)
    setLevelVal('')
    setLevelLabel('')
    setShowLevelForm(true)
  }

  const handleOpenLevelEdit = (level: StudentLevel) => {
    setEditLevel(level)
    setLevelVal(level.value)
    setLevelLabel(level.label)
    setShowLevelForm(true)
  }

  const handleSaveLevel = async () => {
    const val = levelVal.trim()
    const label = levelLabel.trim()
    if (!val) { toast.error('Vui lòng nhập mã trình độ'); return }
    if (!label) { toast.error('Vui lòng nhập tên trình độ'); return }

    // Check duplicate value
    const duplicate = levels.some(l => l.value.toUpperCase() === val.toUpperCase() && l.id !== editLevel?.id)
    if (duplicate) { toast.error('Mã trình độ đã tồn tại'); return }

    setLevelSaving(true)
    try {
      if (!editLevel) {
        await createStudentLevel({ value: val, label })
        toast.success('Đã thêm trình độ mới')
      } else {
        if (editLevel.id) {
          await updateStudentLevel(editLevel.id, { value: val, label })
          toast.success('Đã cập nhật trình độ')
        }
      }
      lRefetch()
      setShowLevelForm(false)
    } catch (e: any) {
      toast.error(e.message || 'Không thể lưu trình độ')
    } finally {
      setLevelSaving(false)
    }
  }

  const handleDeleteLevel = async () => {
    if (!deleteLevel || !deleteLevel.id) return
    try {
      await softDeleteStudentLevel(deleteLevel.id)
      toast.success('Đã xoá trình độ')
      setDeleteLevel(null)
      lRefetch()
    } catch (e: any) {
      toast.error(e.message || 'Không thể xoá trình độ')
    }
  }

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

  const handleSavePolicy = () => {
    try {
      localStorage.setItem('attendance_deduction_policy', JSON.stringify(policy))
      toast.success('Đã lưu cấu hình trừ buổi học thành công')
    } catch (e: any) {
      toast.error('Không thể lưu cấu hình')
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
          { id: 'years', label: 'Năm học', icon: 'calendar' },
          { id: 'levels', label: 'Trình độ', icon: 'award' },
          { id: 'attendance', label: 'Trừ buổi điểm danh', icon: 'settings' },
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

      {/* ── Levels ── */}
      {tab === 'levels' && (
        <div style={{ background: 'var(--card)', borderRadius: 16, border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Danh sách trình độ</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{levels.length} trình độ</div>
            </div>
            <Button icon="plus" onClick={handleOpenLevelAdd}>Thêm trình độ</Button>
          </div>

          {lLoad ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 28, height: 28, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px' }} />
              <span style={{ fontSize: 13, color: 'var(--text-4)' }}>Đang tải...</span>
            </div>
          ) : levels.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>Chưa có trình độ nào. Nhấn "Thêm trình độ" để tạo mới.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--table-header)', borderBottom: '2px solid var(--border)' }}>
                  {['Mã trình độ', 'Tên trình độ', ''].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-3)', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {levels.map((l) => (
                  <tr key={l.id || l.value} style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--table-row-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, background: 'var(--hover-bg)', padding: '2px 8px', borderRadius: 6, color: 'var(--primary)' }}>{l.value}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-1)' }}>{l.label}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button onClick={() => handleOpenLevelEdit(l)}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-2)', fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>
                          <Icon name="edit" size={12} /> Sửa
                        </button>
                        <button onClick={() => setDeleteLevel(l)}
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

      {/* ── Attendance Policy ── */}
      {tab === 'attendance' && (
        <Card animate>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="settings" size={18} /> Cấu hình trừ buổi học theo điểm danh
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 24, lineHeight: '1.6' }}>
            Thiết lập trạng thái điểm danh nào sẽ <strong>trực tiếp trừ đi số buổi học còn lại</strong> của học viên trong lớp đăng ký.
            Mặc định tất cả các trạng thái đều trừ buổi học.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            <SettingToggle
              label="Có mặt (Present)"
              desc="Học viên đi học và được điểm danh có mặt. Trừ 1 buổi học."
              on={policy.present}
              onToggle={() => setPolicy({ ...policy, present: !policy.present })}
            />
            <SettingToggle
              label="Đi muộn (Late)"
              desc="Học viên đi học muộn. Trừ 1 buổi học."
              on={policy.late}
              onToggle={() => setPolicy({ ...policy, late: !policy.late })}
            />
            <SettingToggle
              label="Vắng không phép (Absent)"
              desc="Học viên nghỉ học và không phép. Trừ 1 buổi học."
              on={policy.absent}
              onToggle={() => setPolicy({ ...policy, absent: !policy.absent })}
            />
            <SettingToggle
              label="Vắng có phép (Excused)"
              desc="Học viên nghỉ học nhưng có đơn xin phép trước. Trừ 1 buổi học."
              on={policy.excused}
              onToggle={() => setPolicy({ ...policy, excused: !policy.excused })}
            />
          </div>

          {/* Công thức mô phỏng trực quan */}
          <div style={{
            background: 'var(--hover-bg)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--border-light)',
            marginBottom: 24
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="info" size={14} /> Minh họa công thức tính buổi học còn lại:
            </div>
            <div style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-1)', lineHeight: '1.8' }}>
              <div>Số buổi còn lại = <span style={{ color: 'var(--text-4)' }}>Tổng số buổi của lớp</span> - Số buổi học đã trừ</div>
              <div style={{ marginTop: 6, paddingLeft: 12, borderLeft: '3.5px solid var(--primary)', display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                <span>Số buổi đã trừ = </span>
                {(!policy.present && !policy.late && !policy.absent && !policy.excused) ? (
                  <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>Không có trạng thái nào bị trừ (luôn bằng 0)</span>
                ) : (
                  <>
                    {policy.present && <span style={{ background: 'var(--success-light)', color: 'var(--success-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Có mặt × 1</span>}
                    {policy.present && (policy.late || policy.absent || policy.excused) && <span>+</span>}
                    {policy.late && <span style={{ background: 'var(--info-light)', color: 'var(--info-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Đi muộn × 1</span>}
                    {policy.late && (policy.absent || policy.excused) && <span>+</span>}
                    {policy.absent && <span style={{ background: 'var(--error-light)', color: 'var(--error-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Vắng không phép × 1</span>}
                    {policy.absent && policy.excused && <span>+</span>}
                    {policy.excused && <span style={{ background: 'var(--warning-light)', color: 'var(--warning-dark)', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Vắng có phép × 1</span>}
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon="check" onClick={handleSavePolicy}>
              Lưu cấu hình
            </Button>
          </div>
        </Card>
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

      {/* Levels Form Modal */}
      <Modal
        open={showLevelForm}
        onClose={() => setShowLevelForm(false)}
        title={editLevel === null ? 'Thêm trình độ mới' : 'Chỉnh sửa trình độ'}
        width={450}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 4px' }}>
          <Input
            label="Mã trình độ (Ví dụ: A1, B2)"
            value={levelVal}
            onChange={setLevelVal}
            placeholder="Nhập mã trình độ..."
            required
            disabled={editLevel !== null}
          />
          <Input
            label="Tên trình độ (Ví dụ: A1 · Starter)"
            value={levelLabel}
            onChange={setLevelLabel}
            placeholder="Nhập tên trình độ..."
            required
          />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="outline" onClick={() => setShowLevelForm(false)}>Huỷ</Button>
            <Button onClick={handleSaveLevel} disabled={levelSaving}>{levelSaving ? 'Đang lưu...' : 'Lưu'}</Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete level */}
      <ConfirmDialog
        open={deleteLevel !== null}
        title="Xoá trình độ"
        message={`Bạn có chắc muốn xoá trình độ "${deleteLevel !== null ? deleteLevel?.label : ''}"?`}
        confirmLabel="Xoá"
        onConfirm={handleDeleteLevel}
        onCancel={() => setDeleteLevel(null)}
      />
    </div>
  )
}

export default Config
