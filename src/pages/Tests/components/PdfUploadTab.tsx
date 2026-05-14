import React, { useRef, useState } from 'react'
import jsPDF from 'jspdf'
import { Button, Icon } from '../../../components'
import { uploadTestPdf, removeTestPdf } from '../../../services/tests'
import type { DbTest } from '../../../types/database'

interface Props {
  test: DbTest
  onUpdate: (pdfUrl: string | null) => void
}

const ACCEPTED = 'application/pdf,image/jpeg,image/png,image/webp,image/gif'
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 30 * 1024 * 1024

// Dùng Canvas để convert bất kỳ format ảnh nào (kể cả WEBP) về JPEG cho jsPDF
const loadImageToJpeg = (file: File): Promise<{ dataUrl: string; w: number; h: number }> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(objectUrl)
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error(`Không đọc được ảnh: ${file.name}`)) }
    img.src = objectUrl
  })

const convertImagesToPdf = async (files: File[]): Promise<File> => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 10
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2

  for (let i = 0; i < files.length; i++) {
    if (i > 0) doc.addPage()
    const { dataUrl, w, h } = await loadImageToJpeg(files[i])
    const ratio = Math.min(maxW / w, maxH / h)
    const imgW  = w * ratio
    const imgH  = h * ratio
    const x = margin + (maxW - imgW) / 2
    const y = margin + (maxH - imgH) / 2
    doc.addImage(dataUrl, 'JPEG', x, y, imgW, imgH)
  }

  const blob = doc.output('blob')
  return new File([blob], 'test.pdf', { type: 'application/pdf' })
}

export const PdfUploadTab: React.FC<Props> = ({ test, onUpdate }) => {
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving]   = useState(false)
  const [dragOver, setDragOver]   = useState(false)
  const [status, setStatus]       = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return

    for (const f of files) {
      if (f.size > MAX_BYTES) {
        setError(`File "${f.name}" quá lớn. Tối đa 30MB mỗi file.`)
        return
      }
      const ok = f.type === 'application/pdf' || IMAGE_TYPES.includes(f.type)
      if (!ok) {
        setError(`File "${f.name}" không được hỗ trợ. Chấp nhận: PDF, JPG, PNG, WEBP.`)
        return
      }
    }

    setError(null)
    setUploading(true)

    try {
      let uploadFile: File

      const allImages = files.every(f => IMAGE_TYPES.includes(f.type))
      const isPdf = files.length === 1 && files[0].type === 'application/pdf'

      if (isPdf) {
        uploadFile = files[0]
        setStatus('Đang upload PDF...')
      } else if (allImages) {
        setStatus(files.length > 1
          ? `Đang chuyển ${files.length} ảnh thành PDF...`
          : 'Đang chuyển ảnh thành PDF...')
        uploadFile = await convertImagesToPdf(files)
      } else {
        setError('Không thể kết hợp PDF và ảnh. Vui lòng chọn một loại.')
        setUploading(false)
        return
      }

      setStatus('Đang upload...')
      const url = await uploadTestPdf(test.id, uploadFile)
      onUpdate(url)
      setStatus(null)
    } catch (err: any) {
      console.error('[PdfUploadTab]', err)
      setError(err?.message ?? 'Upload thất bại. Vui lòng thử lại.')
      setStatus(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    setRemoving(true)
    setError(null)
    try {
      await removeTestPdf(test.id)
      onUpdate(null)
    } catch {
      setError('Không thể xóa file.')
    } finally {
      setRemoving(false)
    }
  }

  const pdfUrl = test.pdf_url

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>
            File đề thi
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            {pdfUrl
              ? 'File đã đính kèm — xem trực tiếp khi bấm "Xem PDF".'
              : 'Hỗ trợ PDF và ảnh (JPG, PNG, WEBP). Nhiều ảnh → ghép 1 PDF.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {pdfUrl && (
            <Button size="sm" variant="danger" icon="trash" loading={removing} onClick={handleRemove}>
              Xóa
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            icon="upload"
            loading={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {pdfUrl ? 'Thay file' : 'Chọn file'}
          </Button>
        </div>
      </div>

      {/* Status */}
      {uploading && status && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: 'var(--primary-light)', color: 'var(--primary)',
          fontSize: 13, flexShrink: 0,
        }}>
          <Icon name="loader" size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
          {status}
        </div>
      )}

      {/* Error */}
      {error && !uploading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', borderRadius: 8,
          background: 'var(--error-light)', color: 'var(--error)',
          fontSize: 13, flexShrink: 0,
        }}>
          <Icon name="alert-circle" size={14} />
          {error}
        </div>
      )}

      {/* Preview or Drop zone */}
      {pdfUrl ? (
        <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', minHeight: 0 }}>
          <iframe src={pdfUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Đề thi" />
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            if (!uploading) processFiles(Array.from(e.dataTransfer.files))
          }}
          onClick={() => !uploading && inputRef.current?.click()}
          style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
            border: `2px dashed ${dragOver ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 16,
            background: dragOver ? 'var(--primary-light)' : 'var(--hover-bg)',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
            minHeight: 200,
          }}
        >
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={uploading ? 'loader' : 'image'} size={30}
              style={{ color: 'var(--primary)', ...(uploading ? { animation: 'spin 0.8s linear infinite' } : {}) }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>
              {uploading ? status : 'Kéo thả file vào đây'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              PDF · JPG · PNG · WEBP<br />
              Nhiều ảnh sẽ được ghép thành 1 PDF · Tối đa 30MB/file
            </div>
          </div>

          {/* File type badges */}
          {!uploading && (
            <div style={{ display: 'flex', gap: 6 }}>
              {['PDF', 'JPG', 'PNG', 'WEBP'].map(t => (
                <span key={t} style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px',
                  borderRadius: 6, border: '1px solid var(--border)',
                  color: 'var(--text-3)', background: 'var(--card)',
                }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) processFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}
