import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface Option {
  value: string;
  label: string;
}

interface SelectBoxMultipleProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const SelectBoxMultiple: React.FC<SelectBoxMultipleProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Chọn các mục...',
  style = {},
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

  const toggleOption = (optValue: string) => {
    const newValue = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onChange(newValue);
  };

  const selectedLabels = options
    .filter((o) => value.includes(o.value))
    .map((o) => o.label);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative', ...style }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</label>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          minHeight: 40,
          padding: '6px 12px',
          background: 'var(--input-bg)',
          border: isOpen ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(255, 107, 53, 0.1)' : 'none',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
          {value.length === 0 ? (
            <span style={{ color: 'var(--text-3)', fontSize: 14 }}>{placeholder}</span>
          ) : (
            options
              .filter((o) => value.includes(o.value))
              .map((o) => (
                <div
                  key={o.value}
                  style={{
                    background: 'var(--primary-light, rgba(255, 107, 53, 0.1))',
                    color: 'var(--primary)',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(o.value);
                  }}
                >
                  {o.label}
                  <Icon name="x" size={12} />
                </div>
              ))
          )}
        </div>
        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color="var(--text-3)" />
      </div>

      {isOpen && (
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
          {options.map((o) => {
            const isSelected = value.includes(o.value);
            return (
              <div
                key={o.value}
                onClick={() => toggleOption(o.value)}
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
                  fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isSelected ? 'rgba(255, 107, 53, 0.1)' : 'var(--hover-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? 'rgba(255, 107, 53, 0.05)' : 'transparent')}
              >
                {o.label}
                {isSelected && <Icon name="check" size={14} color="var(--primary)" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
