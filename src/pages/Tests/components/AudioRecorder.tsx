import React, { useEffect, useRef, useState } from 'react'
import { Button, Icon } from '../../../components'

interface Props {
  existingUrl?: string | null
  onRecorded: (blob: Blob) => void
  onRemove?: () => void
  maxSeconds?: number
}

export const AudioRecorder: React.FC<Props> = ({ existingUrl, onRecorded, onRemove, maxSeconds = 120 }) => {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed]     = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const timerRef         = useRef<ReturnType<typeof setInterval> | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)

  useEffect(() => () => {
    // Cleanup on unmount
    if (timerRef.current) clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [])

  const start = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mr

      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(url)
        onRecorded(blob)
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }

      mr.start()
      setRecording(true)
      setElapsed(0)

      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= maxSeconds) {
            stop()
            return maxSeconds
          }
          return prev + 1
        })
      }, 1000)
    } catch (e: any) {
      setError(e.message ?? 'Không thể truy cập microphone.')
    }
  }

  const stop = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  }

  const showUrl = previewUrl ?? existingUrl

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!recording ? (
          <Button size="sm" variant="outline" icon="zap" onClick={start}>
            {showUrl ? 'Ghi âm lại' : 'Bắt đầu ghi âm'}
          </Button>
        ) : (
          <Button size="sm" variant="danger" icon="check" onClick={stop}>
            Dừng ({fmt(elapsed)})
          </Button>
        )}

        {recording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: 'var(--error)',
              animation: 'pulse 1s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>REC</span>
            <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
              tối đa {fmt(maxSeconds)}
            </span>
          </div>
        )}

        {showUrl && !recording && onRemove && (
          <Button size="sm" variant="ghost" icon="trash" onClick={onRemove}>
            Xóa
          </Button>
        )}
      </div>

      {showUrl && (
        <audio
          controls
          src={showUrl}
          style={{ width: '100%', height: 36 }}
        />
      )}

      {error && (
        <div style={{
          fontSize: 12, color: 'var(--error)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="alert-circle" size={12} /> {error}
        </div>
      )}
    </div>
  )
}
