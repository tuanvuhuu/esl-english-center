import React, { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { Modal, Button, Icon, useConfirm, useToast } from '../../../components'
import { getVocabulary, insertVocabulary, deleteVocabulary, fetchDictionaryDetails } from '../../../services/vocabulary'
import { CEFR_VOCABULARY_SEED } from '../../../data/cefrVocabularySeed'
import type { DbVocabularyEntry } from '../../../types/database'

interface ManageVocabularyModalProps {
  open: boolean
  onClose: () => void
}

const LEVEL_COLORS: Record<string, string> = {
  A1: '#22c55e',
  A2: '#3b82f6',
  B1: '#a855f7',
  B2: '#f97316',
  C1: '#ef4444',
  C2: '#ec4899',
}

export const ManageVocabularyModal: React.FC<ManageVocabularyModalProps> = ({ open, onClose }) => {
  const confirm = useConfirm()
  const toast = useToast()
  const [items, setItems] = useState<DbVocabularyEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImportArea, setShowImportArea] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getVocabulary({
        cefr_level: level || undefined,
        search: search || undefined
      })
      setItems(data)
    } catch (err: any) {
      toast.error('Lỗi tải từ vựng: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) load()
  }, [open, level])

  // Debounce search
  useEffect(() => {
    if (!open) return
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search])

  const handleSeed = async () => {
    const ok = await confirm({
      title: 'Nạp dữ liệu mẫu',
      message: 'Hành động này sẽ nạp 60 từ vựng CEFR mẫu (A1-C1) chất lượng cao vào kho từ vựng. Bạn có muốn tiếp tục?',
      confirmLabel: 'Nạp dữ liệu',
      variant: 'primary',
    })
    if (!ok) return

    setSeeding(true)
    try {
      await insertVocabulary(CEFR_VOCABULARY_SEED)
      toast.success('Đã nạp thành công 60 từ vựng CEFR mẫu!')
      load()
    } catch (err: any) {
      toast.error('Lỗi khi nạp dữ liệu mẫu: ' + err.message)
    } finally {
      setSeeding(false)
    }
  }

  const handleDelete = async (id: string, word: string) => {
    const ok = await confirm({
      title: 'Xóa từ vựng',
      message: `Bạn có chắc chắn muốn xóa từ "${word}" khỏi kho từ vựng?`,
      confirmLabel: 'Xóa',
      variant: 'danger',
    })
    if (!ok) return

    try {
      await deleteVocabulary(id)
      toast.success(`Đã xóa từ "${word}" khỏi kho.`)
      setItems(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      toast.error('Lỗi khi xóa từ vựng: ' + err.message)
    }
  }

  const handleSyncIPA = async (item: DbVocabularyEntry) => {
    setSyncingId(item.id)
    try {
      const details = await fetchDictionaryDetails(item.word)
      if (!details.phonetic && !details.audio_url) {
        toast.warning(`Không tìm thấy phiên âm cho từ "${item.word}" trên API tự do.`)
        return
      }

      await insertVocabulary([{
        ...item,
        phonetic: details.phonetic || item.phonetic,
        audio_url: details.audio_url || item.audio_url
      }])
      toast.success(`Đã đồng bộ phiên âm/audio cho từ "${item.word}"!`)
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, phonetic: details.phonetic || i.phonetic, audio_url: details.audio_url || i.audio_url } : i))
    } catch (err: any) {
      toast.error('Lỗi đồng bộ: ' + err.message)
    } finally {
      setSyncingId(null)
    }
  }

  const handleImportExcel = async () => {
    if (!selectedFile) return
    setImporting(true)
    try {
      let workbook
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Không đọc được file CSV'))
          reader.readAsText(selectedFile, 'utf-8')
        })
        workbook = XLSX.read(text, { type: 'string' })
      } else {
        const buffer = await selectedFile.arrayBuffer()
        workbook = XLSX.read(buffer, { type: 'array' })
      }
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' })

      if (rows.length === 0) {
        throw new Error('File rỗng hoặc không đúng định dạng.')
      }

      const entries: Partial<DbVocabularyEntry>[] = rows.map((row, idx) => {
        const word = String(row.word || row.Word || '').trim()
        const cefr_level = String(row.cefr_level || row.level || row.Level || 'A1').trim().toUpperCase()

        if (!word) {
          throw new Error(`Dòng ${idx + 2}: Thiếu cột từ vựng (word).`)
        }

        return {
          word,
          cefr_level,
          meaning_vi: row.meaning_vi || row.meaning || '',
          meaning_en: row.meaning_en || '',
          part_of_speech: row.part_of_speech || row.type || 'noun',
          topic: row.topic || '',
          example_sentence: row.example_sentence || row.example || '',
          example_vi: row.example_vi || '',
          source: 'excel_import'
        }
      })

      await insertVocabulary(entries)
      toast.success(`Nhập thành công ${entries.length} từ vựng mới!`)
      setSelectedFile(null)
      setShowImportArea(false)
      load()
    } catch (err: any) {
      toast.error('Lỗi import file: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const playAudio = (url: string) => {
    if (!url) return
    const audio = new Audio(url)
    audio.play().catch(e => {
      toast.error('Không thể phát âm thanh phát âm.')
      console.error(e)
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Quản lý từ vựng CEFR" width={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '70vh' }}>
        
        {/* Header Toolbar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 300 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Icon name="search" size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
              <input
                placeholder="Tìm từ vựng..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', height: 32, paddingLeft: 30, paddingRight: 10,
                  borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--card)', color: 'var(--text-1)',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box'
                }}
              />
            </div>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              style={{
                height: 32, padding: '0 10px', borderRadius: 8, fontSize: 13,
                border: '1px solid var(--border)', background: 'var(--card)',
                color: 'var(--text-2)', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="">Tất cả Level</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              variant="outline"
              icon="upload"
              onClick={() => setShowImportArea(!showImportArea)}
            >
              Import Excel / CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon="zap"
              loading={seeding}
              onClick={handleSeed}
              style={{ borderColor: 'var(--primary-light)', color: 'var(--primary)' }}
            >
              🌱 Nạp dữ liệu mẫu
            </Button>
          </div>
        </div>

        {/* Excel Import Area */}
        {showImportArea && (
          <div style={{
            padding: 16, border: '1px dashed var(--border)', borderRadius: 10,
            background: 'var(--hover-bg)', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>
              Chọn file Excel (.xlsx, .xls) hoặc CSV để import từ vựng
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>
              Cột yêu cầu: <code>word</code>, <code>cefr_level</code>. Cột tùy chọn: <code>meaning_vi</code>, <code>meaning_en</code>, <code>part_of_speech</code>, <code>topic</code>, <code>example_sentence</code>, <code>example_vi</code>.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12 }}
              />
              <Button
                size="sm"
                variant="primary"
                disabled={!selectedFile}
                loading={importing}
                onClick={handleImportExcel}
              >
                Tải lên
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setSelectedFile(null); setShowImportArea(false); }}
              >
                Hủy
              </Button>
            </div>
          </div>
        )}

        {/* Main List Table */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--card)' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>Đang tải từ vựng...</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
              Không có từ vựng nào trong kho. Hãy nạp dữ liệu mẫu hoặc import từ file.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--hover-bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)' }}>Từ vựng</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)', width: 60 }}>Level</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)', width: 80 }}>Từ loại</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)' }}>Nghĩa (VI / EN)</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)' }}>Phiên âm & Nghe</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)' }}>Ví dụ</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-3)', width: 70, textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', verticalAlign: 'top' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-1)' }}>
                      {item.word}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, color: '#fff',
                        background: LEVEL_COLORS[item.cefr_level] || '#64748b'
                      }}>
                        {item.cefr_level}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-3)' }}>
                      {item.part_of_speech || 'noun'}
                    </td>
                    <td style={{ padding: '10px 12px', lineHeight: 1.4 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)' }}>{item.meaning_vi}</div>
                      {item.meaning_en && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.meaning_en}</div>}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>
                          {item.phonetic || '--'}
                        </span>
                        {item.audio_url && (
                          <button
                            onClick={() => playAudio(item.audio_url!)}
                            style={{
                              background: 'var(--primary-light)', border: 'none', borderRadius: '50%',
                              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'var(--primary)'
                            }}
                            title="Nghe phát âm"
                          >
                            <Icon name="volume" size={10} />
                          </button>
                        )}
                        {!item.phonetic && (
                          <button
                            onClick={() => handleSyncIPA(item)}
                            disabled={syncingId === item.id}
                            style={{
                              background: 'transparent', border: 'none', color: 'var(--text-4)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center'
                            }}
                            title="Đồng bộ phiên âm/audio tự động"
                          >
                            <Icon name={syncingId === item.id ? "refresh" : "zap"} size={12} style={{ animation: syncingId === item.id ? 'spin 1s linear infinite' : 'none' }} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', lineHeight: 1.4 }}>
                      {item.example_sentence ? (
                        <>
                          <div style={{ fontStyle: 'italic', color: 'var(--text-2)' }}>"{item.example_sentence}"</div>
                          {item.example_vi && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{item.example_vi}</div>}
                        </>
                      ) : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleDelete(item.id, item.word)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: 'var(--text-4)', padding: 4
                        }}
                        title="Xóa từ vựng"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>
            Tổng số: <strong>{items.length}</strong> từ vựng CEFR
          </span>
          <Button variant="secondary" onClick={onClose}>Đóng</Button>
        </div>
      </div>
      
      {/* Spinning Keyframes styling */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Modal>
  )
}
