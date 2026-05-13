import React from 'react'

interface Props {
  text?: string
}

export const LoadingSpinner: React.FC<Props> = ({ text = 'Đang tải...' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--primary)',
      animation: 'spin 0.7s linear infinite',
    }} />
    <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{text}</div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
)
