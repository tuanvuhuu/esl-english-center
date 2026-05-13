import React, { useState } from 'react';

interface SettingToggleProps {
  label: string;
  desc: string;
  on?: boolean;
  onToggle?: () => void;
}

export const SettingToggle: React.FC<SettingToggleProps> = ({ 
  label, 
  desc, 
  on: initialOn = false, 
  onToggle: externalToggle 
}) => {
  const [internalOn, setInternalOn] = useState(initialOn);
  
  const handleClick = () => {
    if (externalToggle) {
      externalToggle();
    } else {
      setInternalOn(!internalOn);
    }
  };
  
  const isOn = externalToggle ? initialOn : internalOn;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-4)' }}>{desc}</div>
      </div>
      <button
        onClick={handleClick}
        style={{
          width: 48,
          height: 28,
          borderRadius: 14,
          border: 'none',
          cursor: 'pointer',
          background: isOn ? 'var(--primary)' : 'var(--border)',
          position: 'relative',
          transition: 'background 0.3s cubic-bezier(0.16,1,0.3,1)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: 3,
            left: isOn ? 23 : 3,
            transition: 'left 0.3s cubic-bezier(0.16,1,0.3,1)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
};
