import React from 'react'
import { Button, Select } from '../../../components'
import type { Student } from '../../../types/data'
import { bulkSoftDeleteStudents, bulkUpdateStudentStatus } from '../../../services/students'

interface BulkActionsBarProps {
  selectedIds: Set<string>
  students: Student[]
  onClearSelection: () => void
  onRefresh: () => void
  isPending: boolean
  progress: { current: number; total: number } | null
  error: Error | null
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Đang học' },
  { value: 'trial', label: 'Học thử' },
  { value: 'paused', label: 'Tạm nghỉ' },
  { value: 'inactive', label: 'Nghỉ học' },
]

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedIds,
  students: _students,
  onClearSelection,
  onRefresh,
  isPending,
  progress,
  error,
}) => {
  const handleBulkStatusChange = async (newStatus: string) => {
    const ids = Array.from(selectedIds)
    try {
      await bulkUpdateStudentStatus(ids, newStatus as any)
      onRefresh()
      onClearSelection()
    } catch (err) {
      console.error('Bulk status change failed:', err)
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Xoá ${selectedIds.size} học viên?`)) return
    const ids = Array.from(selectedIds)
    try {
      await bulkSoftDeleteStudents(ids)
      onRefresh()
      onClearSelection()
    } catch (err) {
      console.error('Bulk delete failed:', err)
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: 'var(--bg-1)',
        borderTop: '1px solid var(--border)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        zIndex: 10,
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
          Đã chọn {selectedIds.size}
        </span>
        {progress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
            <div
              style={{
                width: 120,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'var(--bg-2)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'var(--primary)',
                  width: `${(progress.current / progress.total) * 100}%`,
                  transition: 'width 0.2s ease-out',
                }}
              />
            </div>
            <span>{progress.current} / {progress.total}</span>
          </div>
        )}
        {error && (
          <span style={{ fontSize: 12, color: 'var(--error)' }}>
            Lỗi: {error.message}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <Select
          value=""
          onChange={handleBulkStatusChange}
          options={[
            { value: '', label: 'Đổi trạng thái...' },
            ...STATUS_OPTIONS,
          ]}
          disabled={isPending}
          style={{ minWidth: 140 }}
        />

        <Button
          size="sm"
          variant="danger"
          icon="trash"
          onClick={handleBulkDelete}
          disabled={isPending}
        >
          Xoá
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onClearSelection}
          disabled={isPending}
        >
          Bỏ chọn
        </Button>
      </div>
    </div>
  )
}
