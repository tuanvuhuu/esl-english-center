import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

interface ToastCtx {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const STYLES: Record<ToastType, { icon: string; color: string; bg: string; border: string }> = {
  success: { icon: '✓', color: '#16a34a', bg: '#f0fdf4', border: '#86efac' },
  error:   { icon: '✕', color: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  warning: { icon: '!', color: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  info:    { icon: 'i', color: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
}

const DURATION = 3500

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), DURATION)
  }, [])

  const remove = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const ctx: ToastCtx = {
    success: msg => add('success', msg),
    error:   msg => add('error', msg),
    warning: msg => add('warning', msg),
    info:    msg => add('info', msg),
  }

  return (
    <Ctx.Provider value={ctx}>
      {children}
      <style>{`
        @keyframes _toast-in {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const s = STYLES[t.type]
          return (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              background: s.bg,
              border: `1.5px solid ${s.border}`,
              borderRadius: 12,
              boxShadow: '0 4px 16px rgba(0,0,0,0.13)',
              minWidth: 240, maxWidth: 360,
              pointerEvents: 'all',
              fontFamily: 'var(--font)',
              animation: '_toast-in 0.22s ease',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0,
                background: s.color, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
              }}>{s.icon}</div>
              <div style={{ flex: 1, fontSize: 13, color: '#1e293b', lineHeight: 1.4 }}>{t.message}</div>
              <button onClick={() => remove(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 18, lineHeight: 1, padding: 2, flexShrink: 0,
              }}>×</button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
