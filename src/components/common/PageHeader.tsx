import React from 'react';
import { FadeIn } from './FadeIn';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <FadeIn delay={0}>
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      flexWrap: 'wrap', 
      gap: 12, 
      marginBottom: 24, 
      animation: 'fadeIn 0.3s ease' 
    }}>
      <div>
        <h1 style={{ 
          fontSize: 24, 
          fontWeight: 800, 
          color: 'var(--text-1)', 
          margin: 0, 
          lineHeight: 1.2 
        }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  </FadeIn>
);
