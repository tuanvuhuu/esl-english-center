import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary' | 'warning'
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const Ctx = createContext<ConfirmFn | null>(null)

export function useConfirm(): ConfirmFn {
  const fn = useContext(Ctx)
  if (!fn) throw new Error('useConfirm must be used inside ConfirmProvider')
  return fn
}

interface State extends ConfirmOptions {
  open: boolean
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<State>({ open: false, message: '' })
  const resolverRef = useRef<(b: boolean) => void>(() => {})

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
      setState({ ...opts, open: true })
    })
  }, [])

  const handleClose = (result: boolean) => {
    resolverRef.current(result)
    setState(prev => ({ ...prev, open: false }))
  }

  const variant = state.variant ?? 'danger'

  return (
    <Ctx.Provider value={confirm}>
      {children}

      <Modal
        open={state.open}
        onClose={() => handleClose(false)}
        title={state.title ?? 'Xác nhận'}
        width={420}
      >
        <p style={{
          color: 'var(--text-2)', fontSize: 14,
          margin: '0 0 24px', lineHeight: 1.6, whiteSpace: 'pre-line',
        }}>
          {state.message}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => handleClose(false)}>
            {state.cancelLabel ?? 'Hủy'}
          </Button>
          <Button variant={variant === 'warning' ? 'primary' : variant} onClick={() => handleClose(true)}>
            {state.confirmLabel ?? 'Xác nhận'}
          </Button>
        </div>
      </Modal>
    </Ctx.Provider>
  )
}
