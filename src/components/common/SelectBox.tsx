import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface Option {
  value: string;
  label: string;
}

interface SelectBoxProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
}

export const SelectBox: React.FC<SelectBoxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Chọn một mục...',
  style = {},
  required = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectOption = (optValue: string) => {
    onChange(optValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', ...style }}>
      {label && (
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
        </label>
      )}
      
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          height: 38,
          padding: '0 12px',
          background: disabled ? 'var(--border-light)' : 'var(--input-bg)',
          border: isOpen ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(255, 107, 53, 0.1)' : 'none',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ color: selectedOption ? 'var(--text-1)' : 'var(--text-3)', fontSize: 13, fontWeight: selectedOption ? 500 : 400 }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="var(--text-3)" />
      </div>

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            maxHeight: 200,
            overflowY: 'auto',
            padding: 6,
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: '8px 12px', color: 'var(--text-4)', fontSize: 13, fontStyle: 'italic', textAlign: 'center' }}>
              Không có lựa chọn nào
            </div>
          ) : (
            options.map((o) => {
              const isSelected = String(o.value) === String(value);
              return (
                <div
                  key={o.value}
                  onClick={() => selectOption(o.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isSelected ? 'rgba(255, 107, 53, 0.05)' : 'transparent',
                    transition: 'all 0.15s',
                    color: isSelected ? 'var(--primary)' : 'var(--text-1)',
                    fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? 'rgba(255, 107, 53, 0.1)' : 'var(--hover-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? 'rgba(255, 107, 53, 0.05)' : 'transparent')}
                >
                  {o.label}
                  {isSelected && <Icon name="check" size={14} color="var(--primary)" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
