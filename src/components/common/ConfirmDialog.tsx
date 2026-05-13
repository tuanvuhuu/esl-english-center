import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Xác nhận', onConfirm, onCancel,
}) => (
  <Modal open={open} onClose={onCancel} title={title} width={400}>
    <p style={{ color: 'var(--text-2)', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>{message}</p>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <Button variant="secondary" onClick={onCancel}>Huỷ</Button>
      <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
    </div>
  </Modal>
)
