import React from 'react';

interface ColorPickerProps {
  label?: string;
  colors: string[];
  value: string;
  onChange: (color: string) => void;
  required?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  label, 
  colors, 
  value, 
  onChange,
  required
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    {label && (
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
      </label>
    )}
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '4px 0' }}>
      {colors.map(c => {
        const isSelected = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: c,
              border: 'none',
              cursor: 'pointer',
              outline: isSelected ? `3px solid ${c}` : 'none',
              outlineOffset: 2,
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              transform: isSelected ? 'scale(1.15)' : 'scale(1)',
              boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              position: 'relative'
            }}
            title={c}
          >
            {isSelected && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)'
              }} />
            )}
          </button>
        );
      })}
    </div>
  </div>
);
