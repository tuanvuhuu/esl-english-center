import React, { useEffect, useState } from 'react'
import { Modal, Button, Icon, Badge, useConfirm, useToast } from '../../../components'
import { useAuth } from '../../../context/AuthContext'
import { getBankQuestions, addBankQuestionToTest, deleteBankQuestion, toggleBankQuestionPublic, BankQuestion } from '../../../services/tests'

interface Props {
  open: boolean
  onClose: () => void
  testId: string
  startOrderIndex: number
  onAdded: () => void
}

const SKILL_LABELS: Record<string, string> = {
  reading: 'Đọc', listening: 'Nghe', speaking: 'Nói', writing: 'Viết', general: 'Chung',
}

export const QuestionBankModal: React.FC<Props> = ({ open, onClose, testId, startOrderIndex, onAdded }) => {
  const confirm = useConfirm()
  const toast = useToast()
  const { user } = useAuth()
  const [items, setItems] = useState<BankQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({ skill: '', level: '', search: '', scope: 'all' as 'all' | 'mine' | 'shared' })
  const [adding, setAdding] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getBankQuestions({
        skill: filters.skill || undefined,
        level: filters.level || undefined,
        search: filters.search || undefined,
        scope: filters.scope,
        userId: user?.id,
      })
      setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { if (open) load() }, [open, filters.skill, filters.level, filters.scope])

  // Debounce search
  useEffect(() => {
    if (!open) return
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [filters.search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selected.size === 0) return
    setAdding(true)
    try {
      let idx = startOrderIndex
      for (const id of selected) {
        await addBankQuestionToTest(id, testId, idx++)
      }
      onAdded()
      onClose()
      setSelected(new Set())
    } finally { setAdding(false) }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Xóa câu hỏi',
      message: 'Bạn có chắc muốn xóa câu hỏi này khỏi kho? Hành động không thể hoàn tác.',
      confirmLabel: 'Xóa',
      variant: 'danger',
    })
    if (!ok) return
    await deleteBankQuestion(id)
    load()
  }

  const handleTogglePublic = async (e: React.MouseEvent, q: BankQuestion) => {
    e.stopPropagation()
    try {
      const nextPublic = !q.is_public
      await toggleBankQuestionPublic(q.id, nextPublic)
      toast.success(nextPublic ? 'Đã chia sẻ câu hỏi này lên kho chung.' : 'Đã đưa câu hỏi về chế độ cá nhân.')
      setItems(prev => prev.map(item => item.id === q.id ? { ...item, is_public: nextPublic } : item))
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message)
    }
  }

  const selectStyle: React.CSSProperties = {
    height: 32, padding: '0 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--card)',
    color: 'var(--text-2)', outline: 'none', cursor: 'pointer',
  }

  return (
    <Modal open={open} onClose={onClose} title="Kho câu hỏi" width={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '65vh' }}>
        {/* Filter & Scope bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                placeholder="Tìm câu hỏi..."
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                style={{
                  width: '100%', height: 32, paddingLeft: 30, paddingRight: 10,
                  borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--text-1)',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <select style={selectStyle} value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))}>
              <option value="">Tất cả kỹ năng</option>
              {Object.entries(SKILL_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
            </select>
            <select style={selectStyle} value={filters.level} onChange={e => setFilters(f => ({ ...f, level: e.target.value }))}>
              <option value="">Tất cả level</option>
              {['Starter', 'Mover', 'Flyer', 'A1', 'A2', 'B1', 'B2'].map(l => (<option key={l} value={l}>{l}</option>))}
            </select>
          </div>

          {/* Scope selector pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>
            {([
              { id: 'all', label: 'Tất cả câu hỏi', icon: 'list' },
              { id: 'mine', label: 'Của tôi', icon: 'user' },
              { id: 'shared', label: 'Được chia sẻ', icon: 'users' },
            ] as const).map(scope => {
              const active = filters.scope === scope.id
              return (
                <button
                  key={scope.id}
                  onClick={() => setFilters(f => ({ ...f, scope: scope.id }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: active ? 'none' : '1px solid var(--border)',
                    background: active ? 'var(--primary)' : 'var(--card)',
                    color: active ? '#fff' : 'var(--text-2)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <Icon name={scope.icon} size={12} />
                  {scope.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              Không tìm thấy câu hỏi nào.
            </div>
          ) : items.map(q => {
            const isSelected = selected.has(q.id)
            return (
              <div
                key={q.id}
                onClick={() => toggle(q.id)}
                style={{
                  padding: 12, borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                  background: isSelected ? 'var(--primary-light)' : 'var(--card)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--primary)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <Icon name="check" size={12} style={{ color: '#fff' }} />}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
                      <Badge variant="info">{SKILL_LABELS[q.skill]}</Badge>
                      {q.level && <Badge variant="default">{q.level}</Badge>}
                      {q.topic && <Badge variant="default">{q.topic}</Badge>}
                      {q.usage_count > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
                          Đã dùng {q.usage_count}x
                        </span>
                      )}
                      {q.created_by === user?.id ? (
                        <Badge variant={q.is_public ? 'success' : 'warning'}>
                          {q.is_public ? 'Đang chia sẻ' : 'Cá nhân'}
                        </Badge>
                      ) : (
                        q.is_public && <Badge variant="success">Được chia sẻ</Badge>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>
                      {q.question_text}
                    </div>
                    {q.options && q.options.length > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 6 }}>
                        {q.options.length} đáp án MCQ
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {q.created_by === user?.id && (
                      <button
                        onClick={e => handleTogglePublic(e, q)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          padding: 4, color: q.is_public ? 'var(--success)' : 'var(--text-4)',
                          display: 'flex', alignItems: 'center'
                        }}
                        title={q.is_public ? 'Đổi về chế độ cá nhân' : 'Chia sẻ lên kho câu hỏi chung'}
                      >
                        <Icon name={q.is_public ? "users" : "user"} size={14} />
                      </button>
                    )}

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(q.id) }}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        padding: 4, color: 'var(--text-4)',
                        display: 'flex', alignItems: 'center'
                      }}
                      title="Xóa khỏi kho"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Đã chọn <strong>{selected.size}</strong> câu hỏi
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button
              variant="primary"
              icon="plus"
              loading={adding}
              disabled={selected.size === 0}
              onClick={handleAddSelected}
            >
              Thêm vào bài kiểm tra
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
