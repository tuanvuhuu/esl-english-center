import React, { useState } from 'react'
import { StatusBadge } from '../../../components'
import { updateStudentStatus } from '../../../services/students'
import type { Student } from '../../../types/data'

interface StatusSelectCellProps {
  student: Student
  onStatusChange?: (studentId: string, newStatus: string) => void
  disabled?: boolean
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Đang học' },
  { value: 'trial', label: 'Học thử' },
  { value: 'paused', label: 'Tạm nghỉ' },
  { value: 'inactive', label: 'Nghỉ học' },
]

export const StatusSelectCell: React.FC<StatusSelectCellProps> = ({
  student,
  onStatusChange,
  disabled = false,
}) => {
  const [status, setStatus] = useState(student.status)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    const prevStatus = status

    setStatus(newStatus)
    setIsPending(true)
    setError(null)

    try {
      await updateStudentStatus(student.id, newStatus)
      onStatusChange?.(student.id, newStatus)
    } catch (err) {
      setStatus(prevStatus)
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsPending(false)
    }
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <StatusBadge status={status} />
        <div style={{ fontSize: 12, color: 'var(--error)' }}>✕</div>
      </div>
    )
  }

  return (
    <select
      value={status}
      onChange={handleStatusChange}
      disabled={disabled || isPending}
      style={{
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-2)',
        color: 'var(--text-1)',
        fontSize: 13,
        cursor: disabled || isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.6 : 1,
      }}
    >
      {STATUS_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
