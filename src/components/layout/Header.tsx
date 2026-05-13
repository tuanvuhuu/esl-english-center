import React, { useRef, useState, useEffect } from 'react';
import { Icon } from '../common/Icon';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useTheme } from '../../hooks/useTheme';
import { NOTIFICATIONS_DATA } from '../../data';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, isMobile }) => {
  const [searchVal, setSearchVal] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { mode, toggle: toggleTheme } = useTheme();
  const { profile, user, logout } = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const displayEmail = user?.email || '';
  const initials = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header
      style={{
        height: 72,
        background: 'var(--header)',
        borderBottom: '1px solid var(--header-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.35s, border-color 0.35s',
      }}
    >
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-2)',
            padding: 4,
            display: 'flex',
          }}
        >
          <Icon name="menu" size={24} />
        </button>
      )}

      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: 0, whiteSpace: 'nowrap' }}>
        {title}
      </h1>
      <div style={{ flex: 1 }} />

      {/* Search */}
      {!isMobile && (
        <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-4)',
            }}
          >
            <Icon name="search" size={16} />
          </div>
          <input
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Tìm học viên, lớp, giáo viên..."
            style={{
              width: '100%',
              padding: '9px 14px 9px 38px',
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              fontSize: 13,
              fontFamily: 'var(--font)',
              color: 'var(--text-1)',
              outline: 'none',
              background: 'var(--input-bg-subtle)',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = 'var(--primary)';
              target.style.background = 'var(--input-bg)';
              target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.08)';
            }}
            onBlur={(e) => {
              const target = e.target as HTMLInputElement;
              target.style.borderColor = 'var(--border)';
              target.style.background = 'var(--input-bg-subtle)';
              target.style.boxShadow = 'none';
            }}
          />
        </div>
      )}

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleTheme}
        style={{
          background: 'var(--hover-bg)',
          border: '1.5px solid var(--border)',
          borderRadius: 12,
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-2)',
          transition: 'all 0.25s',
        }}
        onMouseEnter={(e) => {
          const target = e.currentTarget;
          target.style.background = 'var(--primary-light)';
          target.style.color = 'var(--primary)';
          target.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={(e) => {
          const target = e.currentTarget;
          target.style.background = 'var(--hover-bg)';
          target.style.color = 'var(--text-2)';
          target.style.borderColor = 'var(--border)';
        }}
      >
        <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowNotif(!showNotif)}
          style={{
            position: 'relative',
            background: showNotif ? 'var(--primary-light)' : 'var(--hover-bg)',
            border: `1.5px solid ${showNotif ? 'var(--primary)' : 'var(--border)'}`,
            borderRadius: 12,
            width: 42,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: showNotif ? 'var(--primary)' : 'var(--text-2)',
            transition: 'all 0.2s',
          }}
        >
          <Icon name="bell" size={18} />
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              width: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--header)',
            }}
          >
            3
          </span>
        </button>
        {showNotif && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 52,
              width: 360,
              background: 'var(--card)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              zIndex: 200,
              animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Thông báo</span>
              <Badge variant="primary">3 mới</Badge>
            </div>
            {NOTIFICATIONS_DATA.slice(0, 4).map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-light)',
                  background: n.read ? 'var(--card)' : 'var(--activity-warm)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)')}
              >
                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)', marginBottom: 2 }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{n.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
              </div>
            ))}
            <div style={{ padding: 12, textAlign: 'center' }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                }}
              >
                Xem tất cả →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div ref={userRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 12px 6px 6px', borderRadius: 12,
            background: showUserMenu ? 'var(--primary-light)' : 'var(--hover-bg)',
            border: `1.5px solid ${showUserMenu ? 'var(--primary)' : 'var(--border)'}`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <Avatar initials={initials} size={32} color="var(--primary)" />
          {!isMobile && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{displayEmail}</div>
            </div>
          )}
        </button>
        {showUserMenu && (
          <div style={{
            position: 'absolute', right: 0, top: 52, minWidth: 200,
            background: 'var(--card)', borderRadius: 14, boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)', overflow: 'hidden', zIndex: 200,
            animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{displayEmail}</div>
              {profile?.role_display && (
                <div style={{
                  display: 'inline-block', marginTop: 6, fontSize: 11, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 6,
                  background: 'var(--primary-light)', color: 'var(--primary)',
                }}>{profile.role_display}</div>
              )}
            </div>
            <button
              onClick={() => { setShowUserMenu(false); logout(); }}
              style={{
                width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                fontSize: 13, fontWeight: 600, color: '#ef4444', fontFamily: 'var(--font)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon name="log-out" size={16} />
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
