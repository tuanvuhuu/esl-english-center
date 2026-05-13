import React from 'react';
import { Icon, IconName } from './Icon';

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: React.ReactNode;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <div style={{ 
      width: 28, 
      height: 28, 
      borderRadius: 8, 
      background: 'var(--hover-bg)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      color: 'var(--text-3)', 
      flexShrink: 0, 
      marginTop: 2 
    }}>
      <Icon name={icon} size={14} />
    </div>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>{value}</div>
    </div>
  </div>
);
