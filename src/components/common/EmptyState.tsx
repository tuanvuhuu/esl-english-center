import React from 'react';
import { Icon, IconName } from './Icon';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  desc?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, desc, action }) => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '60px 20px', 
    color: 'var(--text-4)' 
  }}>
    <div style={{ 
      width: 64, 
      height: 64, 
      borderRadius: 16, 
      background: 'var(--hover-bg)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      marginBottom: 16 
    }}>
      <Icon name={icon || 'book'} size={28} />
    </div>
    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>{title}</div>
    {desc && <div style={{ fontSize: 14, color: 'var(--text-4)', marginBottom: 16 }}>{desc}</div>}
    {action}
  </div>
);
