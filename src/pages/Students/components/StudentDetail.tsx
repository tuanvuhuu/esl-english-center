import React, { useState, useEffect, useRef } from 'react';
import { Modal, Avatar, StatusBadge, InfoRow, Button, Tabs, EntityHistoryTimeline, Badge, Icon, LoadingSpinner, useToast, useConfirm } from '../../../components';
import { Student } from '../../../types/data';
import { getStudentById, getClasses, createEnrollment, removeEnrollment } from '../../../services';
import { mapClass } from '../../../lib/mappers';

interface StudentDetailProps {
  student: Student | null;
  onClose: () => void;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
  onSuccess?: () => void;
  defaultTab?: 'info' | 'history';
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const LVL_COLOR: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' }
const RELATION_LABELS: Record<string, string> = {
  mother: 'Mẹ',
  father: 'Bố',
  grandfather: 'Ông',
  grandmother: 'Bà',
  guardian: 'Người giám hộ',
  other: 'Khác',
}

function formatSchedule(schedules: any[]) {
  if (!schedules?.length) return null
  const days = schedules.map((s: any) => DAY_LABELS[s.day_of_week]).join(', ')
  const { start_time, end_time } = schedules[0]
  return `${days} · ${start_time.slice(0, 5)}-${end_time.slice(0, 5)}`
}

export const StudentDetail: React.FC<StudentDetailProps> = ({ student, onClose, onEdit, onDelete, onSuccess, defaultTab = 'info' }) => {
  const toast = useToast()
  const confirm = useConfirm()
  const [activeTab, setActiveTab] = useState<'info' | 'history'>('info')
  const [detail, setDetailData] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [showEnrollPanel, setShowEnrollPanel] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<any[]>([])
  const [classSearch, setClassSearch] = useState('')
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [enrolling, setEnrolling] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const classSearchRef = useRef<HTMLInputElement>(null)

  const fetchDetail = async (id: string) => {
    setLoadingDetail(true)
    try {
      const d = await getStudentById(id)
      setDetailData(d)
    } catch {}
    finally { setLoadingDetail(false) }
  }

  useEffect(() => {
    if (student) {
      setActiveTab(defaultTab)
      setDetailData(null)
      setShowEnrollPanel(false)
      fetchDetail(String(student.id))
    }
  }, [student?.id])

  // Chỉ lấy 1 enrollment active (chưa bị xoá)
  const allEnrollments: any[] = detail?.enrollments ?? []
  const activeEnrollment = allEnrollments.find(
    e => (e.status === 'active' || e.status === 'enrolled') && e.is_deleted !== true
  ) ?? null

  const filteredClasses = availableClasses.filter(c =>
    c.name.toLowerCase().includes(classSearch.toLowerCase()) ||
    (c.teacher || '').toLowerCase().includes(classSearch.toLowerCase())
  )

  const openEnrollPanel = async () => {
    setShowEnrollPanel(true)
    setClassSearch('')
    setLoadingClasses(true)
    try {
      const allClasses = await getClasses({ status: 'active' })
      // Lọc ra lớp hiện tại của HS (nếu có)
      const currentClassId = activeEnrollment?.class?.id
      const mapped = allClasses
        .filter(c => c.id !== currentClassId)
        .map(mapClass)
      setAvailableClasses(mapped)
    } finally {
      setLoadingClasses(false)
      setTimeout(() => classSearchRef.current?.focus(), 100)
    }
  }

  const handleEnroll = async (cls: any) => {
    if (!student) return
    setEnrolling(String(cls.id))
    try {
      await createEnrollment(String(student.id), String(cls.id))
      toast.success(`Đã đăng ký ${student.name} vào lớp ${cls.name}`)
      setShowEnrollPanel(false)
      await fetchDetail(String(student.id))
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || 'Không thể đăng ký lớp')
    } finally {
      setEnrolling(null)
    }
  }

  const handleRemoveEnroll = async () => {
    if (!activeEnrollment) return
    const ok = await confirm({
      title: 'Xác nhận hủy lớp',
      message: `Bỏ ${student?.name} khỏi lớp "${activeEnrollment.class?.name}"?`,
      confirmLabel: 'Xác nhận',
      variant: 'danger',
    })
    if (!ok) return
    setRemoving(activeEnrollment.id)
    try {
      await removeEnrollment(activeEnrollment.id)
      toast.success('Đã bỏ đăng ký lớp học')
      await fetchDetail(String(student!.id))
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || 'Không thể bỏ lớp')
    } finally {
      setRemoving(null)
    }
  }

  const cls = activeEnrollment?.class
  const totalSessions: number | null = cls?.total_sessions ?? null
  const attended: number = activeEnrollment?.attendedSessions ?? 0
  const absent: number = activeEnrollment?.absentSessions ?? 0
  const pct = totalSessions && totalSessions > 0
    ? Math.min(100, Math.round((attended / totalSessions) * 100))
    : null
  const schedule = cls?.class_schedules ? formatSchedule(cls.class_schedules) : null

  return (
    <Modal open={!!student} onClose={onClose} title="Thông tin học viên" width={580}>
      {student && (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: 20, background: 'var(--hover-bg)', borderRadius: 14 }}>
            <Avatar initials={student.avatar || student.name[0]} size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{student.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>
                {student.age ? `${student.age} tuổi · ` : ''}
                {student.gender === 'F' ? 'Nữ' : 'Nam'}
                {student.dob ? ` · Ngày sinh: ${student.dob}` : ''}
              </div>
            </div>
            <StatusBadge status={student.status} />
          </div>

          {/* Tabs */}
          <div style={{ marginBottom: 20 }}>
            <Tabs
              tabs={[
                { id: 'info', label: 'Thông tin chung' },
                { id: 'history', label: 'Lịch sử hoạt động' },
              ]}
              active={activeTab}
              onChange={t => setActiveTab(t as 'info' | 'history')}
            />
          </div>

          {activeTab === 'info' ? (
            loadingDetail ? <LoadingSpinner /> : (
              <div>
                {/* ======= PHẦN LỚP HỌC ======= */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Lớp đang học</span>
                    {!activeEnrollment && !showEnrollPanel && (
                      <Button size="sm" icon="plus" onClick={openEnrollPanel}>Đăng ký lớp</Button>
                    )}
                    {showEnrollPanel && (
                      <Button size="sm" variant="secondary" onClick={() => setShowEnrollPanel(false)}>Huỷ</Button>
                    )}
                  </div>

                  {/* Panel chọn lớp — chỉ hiện khi chưa có lớp */}
                  {showEnrollPanel && (
                    <div style={{ marginBottom: 12, padding: 14, background: 'var(--hover-bg)', borderRadius: 12, border: '1.5px solid var(--primary)', boxShadow: '0 0 0 3px var(--primary-light)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 8 }}>
                        Chọn lớp để đăng ký
                      </div>
                      <input
                        ref={classSearchRef}
                        value={classSearch}
                        onChange={e => setClassSearch(e.target.value)}
                        placeholder="Tìm tên lớp, giáo viên..."
                        style={{
                          width: '100%', padding: '7px 10px', borderRadius: 8,
                          border: '1.5px solid var(--border)', background: 'var(--card)',
                          color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font)',
                          outline: 'none', boxSizing: 'border-box', marginBottom: 8,
                        }}
                      />
                      {loadingClasses ? <LoadingSpinner /> : filteredClasses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-4)', fontSize: 12, fontStyle: 'italic' }}>
                          {classSearch ? 'Không tìm thấy lớp phù hợp' : 'Không có lớp nào đang hoạt động'}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
                          {filteredClasses.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleEnroll(c)}
                              disabled={enrolling === String(c.id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                                padding: '8px 12px', background: 'var(--card)',
                                border: '1px solid var(--border)', borderRadius: 8,
                                cursor: enrolling === String(c.id) ? 'wait' : 'pointer',
                                transition: 'border-color 0.15s', textAlign: 'left',
                                fontFamily: 'var(--font)', opacity: enrolling === String(c.id) ? 0.6 : 1,
                              }}
                              onMouseEnter={e => { if (!enrolling) e.currentTarget.style.borderColor = 'var(--primary)' }}
                              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                              <div style={{ width: 4, height: 32, borderRadius: 2, background: LVL_COLOR[c.level] || '#aaa', flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                                  {c.teacher || '—'}{c.schedule ? ` · ${c.schedule}` : ''}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                <Badge style={{ fontSize: 10, background: `${LVL_COLOR[c.level] || '#aaa'}20`, color: LVL_COLOR[c.level] || 'var(--text-4)' }}>{c.level}</Badge>
                                <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{c.students}/{c.maxStudents}</span>
                                {enrolling === String(c.id)
                                  ? <Icon name="loader" size={13} style={{ color: 'var(--primary)' }} />
                                  : <Icon name="plus" size={13} style={{ color: 'var(--primary)' }} />}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hiện lớp đang học */}
                  {activeEnrollment && cls ? (
                    <div style={{ padding: 14, background: 'var(--hover-bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 4, height: 28, borderRadius: 2, background: LVL_COLOR[cls.level] || '#aaa', flexShrink: 0 }} />
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 14 }}>{cls.name}</span>
                            {cls.level && <Badge style={{ marginLeft: 6, fontSize: 10, background: `${LVL_COLOR[cls.level]}20`, color: LVL_COLOR[cls.level] }}>{cls.level}</Badge>}
                          </div>
                        </div>
                        <button
                          onClick={handleRemoveEnroll}
                          disabled={!!removing}
                          title="Bỏ đăng ký lớp này"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4, borderRadius: 6, opacity: removing ? 0.4 : 1, transition: 'color 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-4)'}
                        >
                          <Icon name="x" size={14} />
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: totalSessions ? 8 : 0 }}>
                        <Icon name="graduation" size={12} style={{ marginRight: 4 }} />{cls.teacher?.full_name || '—'}
                        {schedule && <> · <Icon name="calendar" size={12} style={{ marginRight: 4 }} />{schedule}</>}
                      </div>
                      {totalSessions ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Tiến độ buổi học</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>
                              {attended}/{totalSessions} buổi ({pct}%)
                            </span>
                          </div>
                          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), #FF8F65)', borderRadius: 3, transition: 'width 0.8s ease' }} />
                          </div>
                          {absent > 0 && <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 3, display: 'block' }}>⚠ Vắng {absent} buổi</span>}
                        </div>
                      ) : (attended > 0 || absent > 0) ? (
                        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>Đã học {attended} buổi · Vắng {absent} buổi</div>
                      ) : null}
                    </div>
                  ) : !showEnrollPanel ? (
                    <div style={{ textAlign: 'center', padding: 20, background: 'var(--hover-bg)', borderRadius: 12 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-4)', fontStyle: 'italic', marginBottom: 10 }}>
                        Chưa đăng ký lớp học nào
                      </div>
                      <Button size="sm" icon="plus" onClick={openEnrollPanel}>Đăng ký lớp</Button>
                    </div>
                  ) : null}
                </div>

                {/* ======= THÔNG TIN CÁ NHÂN ======= */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <InfoRow icon="award" label="Trình độ" value={student.level} />
                  <InfoRow icon="calendar" label="Ngày nhập học" value={student.enrollDate} />
                  {student.attendanceRate !== undefined && (
                    <InfoRow icon="check" label="Tỷ lệ đi học" value={`${Math.round(student.attendanceRate)}%`} />
                  )}
                  {student.email && (
                    <InfoRow icon="mail" label="Email học viên" value={student.email} />
                  )}
                </div>

                {/* Danh sách người liên hệ / phụ huynh */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>
                    Danh sách phụ huynh / Người liên hệ
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {detail?.student_parents?.map((sp: any) => {
                      const p = sp.parent
                      if (!p) return null
                      return (
                        <div
                          key={sp.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--hover-bg)',
                            borderRadius: 10,
                            border: '1px solid var(--border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 13 }}>
                                {p.full_name}
                              </span>
                              <Badge style={{ fontSize: 10, background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                {RELATION_LABELS[sp.relation] || sp.relation}
                              </Badge>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {sp.is_primary && (
                                <Badge style={{ fontSize: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                  Liên hệ chính
                                </Badge>
                              )}
                              {sp.is_emergency && (
                                <Badge style={{ fontSize: 9, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                  Khẩn cấp
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
                            {p.phone && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Icon name="phone" size={12} /> {p.phone}
                              </div>
                            )}
                            {p.email && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Icon name="mail" size={12} /> {p.email}
                              </div>
                            )}
                          </div>
                          {p.address && (
                            <div style={{ fontSize: 11, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Icon name="map-pin" size={11} /> {p.address}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {(!detail?.student_parents || detail.student_parents.length === 0) && (
                      <div style={{ fontStyle: 'italic', fontSize: 12, color: 'var(--text-4)', paddingLeft: 4 }}>
                        Không có thông tin người liên hệ
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
                  <Button icon="edit"    variant="outline"   onClick={() => { onEdit?.(student); onClose() }}>Chỉnh sửa</Button>
                  <Button icon="message" variant="secondary">Nhắn tin</Button>
                  <Button icon="trash"   variant="danger"    onClick={() => { onDelete?.(student); onClose() }}>Xoá</Button>
                </div>
              </div>
            )
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              <EntityHistoryTimeline type="student" id={String(student.id)} />
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
