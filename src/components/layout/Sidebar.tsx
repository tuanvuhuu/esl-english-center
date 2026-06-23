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
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '20px 14px 8px',
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.4,
            color: 'var(--text-3)',
            textTransform: 'uppercase',
          }}
        >
          <span style={{
            width: 14, height: 2, borderRadius: 2,
            background: 'linear-gradient(90deg, var(--primary), transparent)',
          }} />
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
          padding: collapsed && !isMobile ? '12px 0' : '11px 14px',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          background: isActive
            ? 'linear-gradient(90deg, rgba(255,107,53,0.16) 0%, rgba(255,107,53,0.04) 100%)'
            : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--sidebar-text)',
          fontSize: 13,
          fontWeight: isActive ? 700 : 500,
          fontFamily: 'var(--font)',
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative',
          textAlign: 'left',
          margin: collapsed && !isMobile ? '2px 8px' : '2px 0',
          boxShadow: isActive ? '0 6px 14px -8px rgba(255,107,53,0.4)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        {isActive && (!collapsed || isMobile) && (
          <span style={{
            position: 'absolute',
            left: -12, top: '50%', transform: 'translateY(-50%)',
            width: 4, height: 22, borderRadius: '0 4px 4px 0',
            background: 'linear-gradient(180deg, #FF6B35, #E55A2B)',
            boxShadow: '0 0 12px rgba(255,107,53,0.6)',
          }} />
        )}
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
          overflowX: 'hidden',
          overflowY: 'hidden',
          flexShrink: 0,
          backdropFilter: 'var(--glass-filter)',
          WebkitBackdropFilter: 'var(--glass-filter)',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: collapsed && !isMobile ? '14px 0' : '14px 18px',
            justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
            borderBottom: '1px solid var(--sidebar-border)',
            minHeight: 64,
            background: 'linear-gradient(135deg, rgba(255,107,53,0.04) 0%, rgba(11,37,69,0.04) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FF6B35 0%, #E55A2B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 900,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(255,107,53,0.4)',
                letterSpacing: -0.5,
              }}
            >
              E
            </div>
            {(!collapsed || isMobile) && (
              <div style={{ animation: 'fadeIn 0.2s ease', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sidebar-text)', lineHeight: 1.2, letterSpacing: -0.2 }}>ESL English</div>
                <div style={{ fontSize: 10, color: 'var(--sidebar-text-sub)', fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>Management</div>
              </div>
            )}
          </div>
          
          {!isMobile && (
            <button
              onClick={() => onToggle(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                color: 'var(--sidebar-text-sub)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--sidebar-text-sub)'}
            >
              <Icon name="chevron-left" size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          padding: collapsed && !isMobile ? '8px 0' : '8px 12px' 
        }}>
          {NAV_ITEMS.map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        <div style={{ 
          padding: collapsed && !isMobile ? '8px 0' : '8px 12px', 
          borderTop: '1px solid var(--sidebar-border)',
          overflow: 'hidden'
        }}>
          {BOTTOM_NAV.map(renderNavItem)}
        </div>

        {/* User Profile */}
        <div
          style={{
            margin: collapsed && !isMobile ? '8px' : '10px 12px 12px',
            padding: collapsed && !isMobile ? '10px 0' : '10px 12px',
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(11,37,69,0.04), rgba(255,107,53,0.04))',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            overflow: 'hidden',
          }}
        >
          <Avatar initials="AD" size={32} color="var(--primary)" />
          {(!collapsed || isMobile) && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sidebar-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin
              </div>
              <div style={{ fontSize: 10, color: 'var(--sidebar-text-sub)', fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase' }}>Quản trị viên</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
