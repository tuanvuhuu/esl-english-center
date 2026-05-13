import React from 'react';

interface AvatarProps {
  initials?: string;
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ initials, size = 40, color, style = {} }) => {
  const bg = color || `hsl(${(initials || 'AA').charCodeAt(0) * 7 + (initials || 'AA').charCodeAt(1) * 13}, 60%, 88%)`;
  const fg = color ? '#fff' : `hsl(${(initials || 'AA').charCodeAt(0) * 7 + (initials || 'AA').charCodeAt(1) * 13}, 50%, 35%)`;
  
  return (
    <div style={{
      width: size, 
      height: size, 
      borderRadius: '50%', 
      background: bg, 
      color: fg,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontSize: size * 0.38, 
      fontWeight: 700, 
      flexShrink: 0, 
      fontFamily: 'var(--font)',
      ...style
    }}>
      {initials}
    </div>
  );
};
