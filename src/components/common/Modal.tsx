import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number | string;
}

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width = 520 }) => {
  if (!open) return null;
  
  return createPortal(
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 20 
    }}>
      <div 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'var(--modal-backdrop)', 
          backdropFilter: 'blur(6px)', 
          transition: 'background 0.35s' 
        }} 
        onClick={onClose} 
      />
      <div style={{
        position: 'relative', 
        background: 'var(--card)', 
        borderRadius: 20, 
        width: '100%', 
        maxWidth: typeof width === 'number' ? width + 80 : width, 
        maxHeight: '90vh',
        overflow: 'auto', 
        boxShadow: 'var(--shadow-xl)', 
        animation: 'modalIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        border: '1px solid var(--border-light)',
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border)', 
          position: 'sticky', 
          top: 0, 
          background: 'var(--card)', 
          zIndex: 1, 
          borderRadius: '20px 20px 0 0' 
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>{title}</h2>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'var(--hover-bg)', 
              border: 'none', 
              borderRadius: 10, 
              width: 36, 
              height: 36, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              color: 'var(--text-3)', 
              transition: 'all 0.15s' 
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>, 
    document.body
  );
};
