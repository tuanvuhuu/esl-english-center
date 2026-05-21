import React, { useState, useEffect, useRef } from 'react'
import { Avatar, Badge, Icon, Button, LoadingSpinner, useToast } from '../../../components'
import { getEnrollmentsByClass, getStudentsNotInClass, createEnrollment, removeEnrollment } from '../../../services'

const LVL_COLOR: Record<string, string> = { A1: '#FF6B35', A2: '#3B82F6', B1: '#10B981', B2: '#8B5CF6' }

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase()
}

interface ClassStudentsPanelProps {
  classId: string
  maxStudents: number
  onSuccess?: () => void
}

export const ClassStudentsPanel: React.FC<ClassStudentsPanelProps> = ({ classId, maxStudents, onSuccess }) => {
  const toast = useToast()
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddPanel, setShowAddPanel] = useState(false)
  const [availableStudents, setAvailableStudents] = useState<any[]>([])
  const [searchQ, setSearchQ] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [loadingAvail, setLoadingAvail] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchEnrollments = async () => {
    setLoading(true)
    try {
      const data = await getEnrollmentsByClass(classId)
      setEnrollments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEnrollments() }, [classId])

  const openAddPanel = async () => {
    setShowAddPanel(true)
    setSearchQ('')
    setLoadingAvail(true)
    try {
      const data = await getStudentsNotInClass(classId)
      setAvailableStudents(data)
    } finally {
      setLoadingAvail(false)
      setTimeout(() => searchRef.current?.focus(), 100)
    }
  }

  const handleAdd = async (student: any) => {
    setAdding(student.id)
    try {
      await createEnrollment(student.id, classId)
      toast.success(`Đã thêm ${student.full_name} vào lớp`)
      setAvailableStudents(prev => prev.filter(s => s.id !== student.id))
      await fetchEnrollments()
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || 'Không thể thêm học sinh')
    } finally {
      setAdding(null)
    }
  }

  const handleRemove = async (enrollment: any) => {
    if (!confirm(`Bỏ ${enrollment.student?.full_name} khỏi lớp?`)) return
    setRemoving(enrollment.id)
    try {
      await removeEnrollment(enrollment.id)
      toast.success(`Đã bỏ ${enrollment.student?.full_name} khỏi lớp`)
      setEnrollments(prev => prev.filter(e => e.id !== enrollment.id))
      setAvailableStudents(prev => enrollment.student ? [...prev, enrollment.student] : prev)
      onSuccess?.()
    } catch (e: any) {
      toast.error(e.message || 'Không thể bỏ học sinh')
    } finally {
      setRemoving(null)
    }
  }

  const filtered = availableStudents.filter(s =>
    s.full_name.toLowerCase().includes(searchQ.toLowerCase())
  )

  const isFull = enrollments.length >= maxStudents

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Danh sách đã đăng ký */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>
            Đã đăng ký
            <Badge variant={isFull ? 'error' : 'success'} style={{ marginLeft: 8, fontSize: 11 }}>
              {enrollments.length}/{maxStudents}
            </Badge>
          </span>
          <Button
            size="sm"
            icon="plus"
            onClick={showAddPanel ? () => setShowAddPanel(false) : openAddPanel}
            disabled={isFull}
          >
            {showAddPanel ? 'Đóng' : 'Thêm học sinh'}
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : enrollments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-4)', fontSize: 13, fontStyle: 'italic' }}>
            Lớp chưa có học sinh nào
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
            {enrollments.map(enr => {
              const s = enr.student
              if (!s) return null
              return (
                <div key={enr.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--hover-bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <Avatar initials={initials(s.full_name)} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
                      Nhập học: {enr.enrolled_date || '—'}
                    </div>
                  </div>
                  {s.level && (
                    <Badge style={{ fontSize: 10, background: `${LVL_COLOR[s.level]}20`, color: LVL_COLOR[s.level] }}>
                      {s.level}
                    </Badge>
                  )}
                  <button
                    onClick={() => handleRemove(enr)}
                    disabled={removing === enr.id}
                    title="Bỏ khỏi lớp"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 4, borderRadius: 6, opacity: removing === enr.id ? 0.5 : 1, flexShrink: 0 }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panel thêm học sinh */}
      {showAddPanel && (
        <div style={{ width: 260, flexShrink: 0, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
            Chọn học sinh
          </div>
          <input
            ref={searchRef}
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Tìm tên học sinh..."
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 8,
              border: '1.5px solid var(--border)', background: 'var(--hover-bg)',
              color: 'var(--text-1)', fontSize: 13, fontFamily: 'var(--font)',
              outline: 'none', boxSizing: 'border-box', marginBottom: 8,
            }}
          />
          {loadingAvail ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-4)', fontSize: 12, fontStyle: 'italic' }}>
              {searchQ ? 'Không tìm thấy' : 'Tất cả đã vào lớp'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 340, overflowY: 'auto' }}>
              {filtered.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleAdd(s)}
                  disabled={adding === s.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '7px 10px', background: 'var(--hover-bg)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    cursor: adding === s.id ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s', textAlign: 'left', fontFamily: 'var(--font)',
                    opacity: adding === s.id ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (adding !== s.id) e.currentTarget.style.borderColor = 'var(--primary)' }}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Avatar initials={initials(s.full_name)} size={26} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.full_name}
                    </div>
                    {s.level && <div style={{ fontSize: 10, color: LVL_COLOR[s.level] || 'var(--text-4)' }}>{s.level}</div>}
                  </div>
                  {adding === s.id
                    ? <Icon name="loader" size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    : <Icon name="plus" size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  }
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
