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
  success: { icon: '✓', color: 'var(--success-text)', bg: 'var(--success-bg)', border: 'var(--success-border)' },
  error:   { icon: '✕', color: 'var(--error-text)', bg: 'var(--error-bg)', border: 'var(--error-border)' },
  warning: { icon: '!', color: 'var(--warning-text)', bg: 'var(--warning-bg)', border: 'var(--warning-border)' },
  info:    { icon: 'i', color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)' },
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
              background: `linear-gradient(0deg, ${s.bg}, ${s.bg}), var(--card)`,
              border: `1.5px solid ${s.border}`,
              borderRadius: 12,
              boxShadow: 'var(--shadow-lg)',
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
              <div style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', lineHeight: 1.4 }}>{t.message}</div>
              <button onClick={() => remove(t.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-4)', fontSize: 18, lineHeight: 1, padding: 2, flexShrink: 0,
              }}>×</button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
