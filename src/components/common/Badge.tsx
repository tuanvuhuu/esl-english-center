import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'primary' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style = {} }) => {
  const colors: Record<BadgeVariant, { bg: string; color: string }> = {
    default: { bg: 'var(--badge-bg)', color: 'var(--badge-color)' },
    success: { bg: 'var(--success-light)', color: 'var(--success-dark)' },
    warning: { bg: 'var(--warning-light)', color: 'var(--warning-dark)' },
    error: { bg: 'var(--error-light)', color: 'var(--error-dark)' },
    primary: { bg: 'var(--primary-light)', color: '#E55A2B' },
    info: { bg: 'var(--info-light)', color: 'var(--info-dark)' },
  };
  const c = colors[variant] || colors.default;
  
  return (
    <span style={{
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '3px 10px', 
      borderRadius: 999,
      fontSize: 12, 
      fontWeight: 600, 
      background: c.bg, 
      color: c.color, 
      whiteSpace: 'nowrap',
      ...style
    }}>
      {children}
    </span>
  );
};

interface StatusBadgeProps {
  status: string;
  type?: 'student' | 'teacher' | 'payment' | 'room';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type }) => {
  const studentMap: Record<string, { label: string; variant: BadgeVariant }> = {
    active:   { label: 'Đang học',  variant: 'success' },
    trial:    { label: 'Học thử',   variant: 'info' },
    paused:   { label: 'Tạm nghỉ', variant: 'warning' },
    inactive: { label: 'Nghỉ học',  variant: 'error' },
  };
  const teacherMap: Record<string, { label: string; variant: BadgeVariant }> = {
    active:     { label: 'Đang dạy', variant: 'success' },
    'on-leave': { label: 'Nghỉ phép', variant: 'warning' },
    inactive:   { label: 'Nghỉ việc', variant: 'error' },
  };
  const sharedMap: Record<string, { label: string; variant: BadgeVariant }> = {
    paid:        { label: 'Đã thanh toán', variant: 'success' },
    pending:     { label: 'Chờ TT',        variant: 'warning' },
    overdue:     { label: 'Quá hạn',       variant: 'error' },
    available:   { label: 'Trống',         variant: 'success' },
    'in-use':    { label: 'Đang dùng',     variant: 'info' },
    maintenance: { label: 'Bảo trì',       variant: 'warning' },
  };

  const contextMap =
    type === 'teacher' ? teacherMap :
    type === 'student' ? studentMap :
    { ...studentMap, ...sharedMap }; // fallback: ưu tiên student cho backward compat

  const m = contextMap[status] ?? sharedMap[status] ?? { label: status, variant: 'default' as BadgeVariant };
  return <Badge variant={m.variant}>{m.label}</Badge>;
};
