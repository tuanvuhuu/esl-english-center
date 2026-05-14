import React, { useRef, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Avatar } from '../common/Avatar';
import { NAV_ITEMS, BOTTOM_NAV, NavItem } from '../../utils/constants';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  isMobile: boolean;
  counts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  collapsed,
  onToggle,
  isMobile,
  counts = {},
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isMobile && !collapsed) {
      const h = (e: MouseEvent) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
          onToggle(true);
        }
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }
  }, [collapsed, isMobile, onToggle]);

  const renderNavItem = (item: NavItem) => {
    if (item.section) {
      if (collapsed && !isMobile) return null;
      return (
        <div
          key={item.section}
          style={{
            padding: '20px 16px 8px',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: 'var(--sidebar-text)',
            opacity: 0.5,
            textTransform: 'uppercase',
          }}
        >
          {item.section}
        </div>
      );
    }

    const isActive = activePage === item.id;
    const showLabel = !collapsed || isMobile;
    const badge = item.id && counts[item.id] != null ? counts[item.id] : item.badge;

    return (
      <button
        key={item.id}
        onClick={() => {
          if (item.id) {
            onNavigate(item.id);
            if (isMobile) onToggle(true);
          }
        }}
        title={collapsed && !isMobile ? item.label : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: collapsed && !isMobile ? '12px 0' : '11px 16px',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          background: isActive ? 'var(--primary-15)' : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--sidebar-text)',
          fontSize: 13,
          fontWeight: isActive ? 700 : 500,
          fontFamily: 'var(--font)',
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative',
          textAlign: 'left',
          margin: collapsed && !isMobile ? '2px 8px' : '2px 0',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = isActive ? 'var(--primary-15)' : 'transparent';
        }}
      >
        <Icon name={item.icon || 'book'} size={20} />
        {showLabel && <span style={{ flex: 1 }}>{item.label}</span>}
        {showLabel && badge != null && (
          <span
            style={{
              background: 'var(--primary)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {badge}
          </span>
        )}
        {!showLabel && badge != null && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--primary)',
            }}
          />
        )}
      </button>
    );
  };

  return (
    <>
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 998,
            animation: 'fadeIn 0.25s ease',
          }}
        />
      )}
      <aside
        ref={sidebarRef}
        style={{
          width: isMobile ? 280 : collapsed ? 72 : 260,
          height: '100vh',
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          transition: isMobile ? 'transform 0.35s cubic-bezier(.4,0,.2,1)' : 'width 0.3s cubic-bezier(.4,0,.2,1), background 0.35s',
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          zIndex: 999,
          transform: isMobile ? (collapsed ? 'translateX(-100%)' : 'translateX(0)') : 'none',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: collapsed && !isMobile ? '20px 0' : '20px 20px',
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            borderBottom: '1px solid var(--sidebar-border)',
            minHeight: 72,
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #FF6B35, #FF8F65)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 800,
              color: '#fff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
            }}
          >
            E
          </div>
          {(!collapsed || isMobile) && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--sidebar-text)', lineHeight: 1.2 }}>ESL English</div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-text-sub)', fontWeight: 500 }}>Center Management</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed && !isMobile ? '8px 0' : '8px 12px' }}>
          {NAV_ITEMS.map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        <div style={{ padding: collapsed && !isMobile ? '8px 0' : '8px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          {BOTTOM_NAV.map(renderNavItem)}
        </div>

        {/* User Profile */}
        <div
          style={{
            padding: collapsed && !isMobile ? '16px 0' : '16px 20px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          }}
        >
          <Avatar initials="AD" size={36} color="var(--primary)" />
          {(!collapsed || isMobile) && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin
              </div>
              <div style={{ fontSize: 11, color: 'var(--sidebar-text-sub)' }}>Quản trị viên</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
