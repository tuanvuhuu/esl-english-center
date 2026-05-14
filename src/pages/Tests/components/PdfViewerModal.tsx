import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '../../../components/common/Icon'
import { Button } from '../../../components/common/Button'
import { generateTestPdfBlobUrl } from '../testExport'
import { getTestQuestions } from '../../../services/tests'
import type { DbTest } from '../../../types/database'

interface Props {
  open: boolean
  onClose: () => void
  test: DbTest | null
}

export const PdfViewerModal: React.FC<Props> = ({ open, onClose, test }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !test) return

    // Nếu test đã có file PDF upload sẵn → dùng luôn, không cần generate
    if (test.pdf_url) {
      setPdfUrl(test.pdf_url)
      setLoading(false)
      return
    }

    let url: string | null = null
    setLoading(true)
    setError(null)
    setPdfUrl(null)

    getTestQuestions(test.id)
      .then(questions => generateTestPdfBlobUrl({ test, questions: questions as any }))
      .then(blobUrl => { url = blobUrl; setPdfUrl(blobUrl) })
      .catch(() => setError('Không thể tạo PDF. Vui lòng thử lại.'))
      .finally(() => setLoading(false))

    return () => { if (url) URL.revokeObjectURL(url) }
  }, [open, test])

  if (!open) return null

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div
        style={{ position: 'absolute', inset: 0, background: 'var(--modal-backdrop)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div style={{
        position: 'relative',
        background: 'var(--card)',
        borderRadius: 20,
        width: '90vw',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-xl)',
        animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        border: '1px solid var(--border-light)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border)',
          background: 'var(--card)', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              {test?.name}
            </h2>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Xem trước đề thi</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {pdfUrl && (
              <Button
                variant="primary"
                size="sm"
                icon="download"
                onClick={() => {
                  const a = document.createElement('a')
                  a.href = pdfUrl
                  a.download = `${test?.name.replace(/\s+/g, '_')}_Test.pdf`
                  a.click()
                }}
              >
                Tải xuống
              </Button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'var(--hover-bg)', border: 'none', borderRadius: 10,
                width: 36, height: 36, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)',
              }}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#e8e8e8' }}>
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12 }}>
              <div style={{
                width: 36, height: 36,
                border: '3px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Đang tạo PDF...</div>
            </div>
          )}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
              <Icon name="alert-circle" size={32} style={{ color: 'var(--error)' }} />
              <div style={{ fontSize: 14, color: 'var(--text-2)' }}>{error}</div>
            </div>
          )}
          {pdfUrl && (
            <iframe
              src={pdfUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="PDF Preview"
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
