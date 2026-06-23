import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Icon } from '../common/Icon';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '../../hooks';
import { getNotifications, markAsRead, markAllAsRead } from '../../services';
import { mapNotification } from '../../lib/mappers';
import { supabase } from '../../lib/supabase';
import { SelectBoxBranch, SelectBoxYear, Input, Button } from '../index';
import { WeatherBadge } from '../common/WeatherBadge';
import { useWeather } from '../../hooks/useWeather';
import TEACHERS_DATA from '../../data/teachers.json';
import STUDENTS_DATA from '../../data/students.json';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
  isMobile: boolean;
  onNavigate?: (page: string, params?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, isMobile, onNavigate }) => {
  const [searchVal, setSearchVal] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);
  const { mode, toggle: toggleTheme, primaryColor, bgImage, setPrimaryColor, setBgImage } = useTheme();
  const { profile, user, logout } = useAuth();
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { data: weather, loading: weatherLoading } = useWeather();

  // Fetch notifications from DB
  const { data: rawNotifs, refetch: refetchNotifs } = useQuery(getNotifications);
  const notifications = (rawNotifs ?? []).map(mapNotification);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Realtime subscription — auto-refresh on new/updated notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        refetchNotifs();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel) };
  }, [refetchNotifs]);

  // Entity type → page mapping
  const ENTITY_PAGE: Record<string, string> = {
    student: 'students', teacher: 'teachers', class: 'classes',
    payment: 'finance', enrollment: 'classes', room: 'rooms',
    test: 'tests',
  };

  const handleNotifClick = useCallback(async (n: ReturnType<typeof mapNotification>) => {
    if (!n.read) {
      markAsRead(String(n.id)).then(() => refetchNotifs()).catch(() => {});
    }
    setShowNotif(false);
    if (n.entityType && ENTITY_PAGE[n.entityType]) {
      onNavigate?.(ENTITY_PAGE[n.entityType]);
    }
  }, [refetchNotifs, onNavigate]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await markAllAsRead(user?.id ?? '');
      refetchNotifs();
    } catch {}
  }, [user, refetchNotifs]);

  const BACKGROUNDS = [
    '',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
  ];

  const THEME_COLORS = ['#FF6B35', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6', '#F59E0B', '#06B6D4'];

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
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header
      style={{
        height: 56,
        background: 'var(--header)',
        borderBottom: '1px solid var(--header-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.35s, border-color 0.35s',
        backdropFilter: 'var(--glass-filter)',
        WebkitBackdropFilter: 'var(--glass-filter)',
      }}
    >
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button variant="ghost" icon="menu" onClick={onMenuClick} style={{ padding: 4 }} children="" />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>{title}</span>
        </div>
      )}

      {/* Search */}
      {!isMobile && (
        <div style={{ position: 'relative' }}>
          <Input
            value={searchVal}
            onChange={setSearchVal}
            placeholder="Tìm học sinh, giáo viên..."
            icon="search"
            style={{ width: 280 }}
          />

          {searchVal.length >= 2 && (
            <div style={{
              position: 'absolute', top: 40, left: 0, width: 340,
              background: 'var(--card)', borderRadius: 12, boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border)', zIndex: 300, overflow: 'hidden',
              backdropFilter: 'var(--glass-filter)', WebkitBackdropFilter: 'var(--glass-filter)',
              animation: 'modalIn 0.2s ease',
            }}>
              {/* Teachers */}
              {(() => {
                const results = TEACHERS_DATA.filter(t => t.name.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 3);
                if (results.length === 0) return null;
                return (
                  <div style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase' }}>Giáo viên</div>
                    {results.map(t => (
                      <div key={t.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }} 
                           onClick={() => {
                             setSearchVal('');
                             onNavigate?.('teachers', { teacherId: t.id, search: t.name, tab: 'history' });
                           }}
                           onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Avatar initials={t.avatar} size={24} color={t.color} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{t.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.nationality} • {t.subjects.join(', ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Students */}
              {(() => {
                const results = STUDENTS_DATA.filter(s => s.name.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 3);
                if (results.length === 0) return null;
                return (
                  <div style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase' }}>Học sinh</div>
                    {results.map(s => (
                      <div key={s.id} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                           onClick={() => {
                             setSearchVal('');
                             onNavigate?.('students', { studentId: s.id, search: s.name, tab: 'history' });
                           }}
                           onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <Avatar initials={s.avatar} size={24} color="var(--primary)" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{s.className} • {s.level}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Parents */}
              {(() => {
                const results = STUDENTS_DATA.filter(s => s.parent.toLowerCase().includes(searchVal.toLowerCase())).slice(0, 3);
                if (results.length === 0) return null;
                return (
                  <div>
                    <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase' }}>Phụ huynh</div>
                    {results.map(s => (
                      <div key={`p-${s.id}`} style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                           onClick={() => {
                             setSearchVal('');
                             onNavigate?.('parents', { search: s.parent, tab: 'history' });
                           }}
                           onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                           onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--hover-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="user" size={14} color="var(--text-3)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{s.parent}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Phụ huynh của: {s.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Empty state */}
              {TEACHERS_DATA.filter(t => t.name.toLowerCase().includes(searchVal.toLowerCase())).length === 0 &&
               STUDENTS_DATA.filter(s => s.name.toLowerCase().includes(searchVal.toLowerCase())).length === 0 &&
               STUDENTS_DATA.filter(s => s.parent.toLowerCase().includes(searchVal.toLowerCase())).length === 0 && (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                  Không tìm thấy kết quả phù hợp
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Branch + Year selectors */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <SelectBoxBranch />
          <SelectBoxYear />
        </div>
      )}

      {/* Weather */}
      {!isMobile && (
        <WeatherBadge data={weather} loading={weatherLoading} />
      )}

      {/* Theme Settings */}
      <div ref={themeRef} style={{ position: 'relative' }}>
        <Button
          variant="secondary"
          icon="settings"
          onClick={() => setShowThemeMenu(!showThemeMenu)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: showThemeMenu ? 'var(--primary-light)' : 'var(--hover-bg)',
            borderColor: showThemeMenu ? 'var(--primary)' : 'var(--border)',
            color: showThemeMenu ? 'var(--primary)' : 'var(--text-2)',
            padding: 0,
          }}
          children=""
        />

        {showThemeMenu && (
          <div style={{
            position: 'absolute', right: 0, top: 44, width: 280,
            background: 'var(--card)', borderRadius: 16, boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)', padding: 20, zIndex: 200,
            animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', marginBottom: 20 }}>Giao diện</div>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Chế độ</div>
              <Button
                variant="secondary"
                icon={mode === 'dark' ? 'sun' : 'moon'}
                onClick={toggleTheme}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {mode === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
              </Button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Hình nền</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {BACKGROUNDS.map((bg, i) => (
                  <div
                    key={i}
                    onClick={() => setBgImage(bg)}
                    style={{
                      aspectRatio: '1/1', borderRadius: 8, cursor: 'pointer',
                      background: bg ? `url(${bg}) center/cover` : 'var(--hover-bg)',
                      border: bgImage === bg ? '2px solid var(--primary)' : '1px solid var(--border)',
                      transition: 'all 0.15s',
                      boxShadow: bgImage === bg ? `0 0 0 2px var(--primary-15)` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 12 }}>Màu sắc</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {THEME_COLORS.map(c => (
                  <div
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    style={{
                      width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
                      background: c,
                      border: primaryColor === c ? '2px solid var(--card)' : 'none',
                      outline: primaryColor === c ? `2px solid ${c}` : 'none',
                      transition: 'all 0.15s',
                      transform: primaryColor === c ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: primaryColor === c ? `0 0 0 1px var(--border)` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <Button
          variant="secondary"
          icon="bell"
          onClick={() => setShowNotif(!showNotif)}
          style={{
            position: 'relative',
            width: 34,
            height: 34,
            borderRadius: 10,
            background: showNotif ? 'var(--primary-light)' : 'var(--hover-bg)',
            borderColor: showNotif ? 'var(--primary)' : 'var(--border)',
            color: showNotif ? 'var(--primary)' : 'var(--text-2)',
            padding: 0,
          }}
          children=""
        />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              background: '#EF4444',
              color: '#fff',
              fontSize: 9,
              fontWeight: 700,
              width: 16,
              height: 16,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--header)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {unreadCount}
          </span>
        )}
        {showNotif && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 44,
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
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>Thông báo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {unreadCount > 0 && (
                  <>
                    <Badge variant="primary">{unreadCount} mới</Badge>
                    <button
                      onClick={handleMarkAllRead}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 600, color: 'var(--primary)',
                        padding: '2px 6px', borderRadius: 6,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <Icon name="check" size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <Icon name="bell" size={32} style={{ color: 'var(--text-4)', opacity: 0.5, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>Chưa có thông báo</div>
                <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>Các hoạt động sẽ xuất hiện tại đây</div>
              </div>
            ) : (
              <>
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid var(--border-light)',
                      background: n.read ? 'var(--card)' : 'var(--activity-warm)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--hover-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)')}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.desc}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'var(--primary)', marginTop: 6, flexShrink: 0,
                        animation: 'pulse 2s ease infinite',
                      }} />
                    )}
                  </div>
                ))}
              </>
            )}
            <div style={{ padding: 10, textAlign: 'center' }}>
              <Button variant="ghost" size="sm" style={{ color: 'var(--primary)' }} onClick={() => { setShowNotif(false); onNavigate?.('notifications') }}>
                Xem tất cả →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* User */}
      <div ref={userRef} style={{ position: 'relative' }}>
        <Button
          variant="secondary"
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            padding: '4px 10px 4px 4px',
            borderRadius: 10,
            background: showUserMenu ? 'var(--primary-light)' : 'var(--hover-bg)',
            borderColor: showUserMenu ? 'var(--primary)' : 'var(--border)',
            height: 34,
          }}
        >
          <Avatar initials={initials} size={26} color="var(--primary)" />
          {!isMobile && (
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{displayName}</div>
              <div style={{ fontSize: 9, color: 'var(--text-4)' }}>{displayEmail}</div>
            </div>
          )}
        </Button>
        {showUserMenu && (
          <div style={{
            position: 'absolute', right: 0, top: 44, minWidth: 200,
            background: 'var(--card)', borderRadius: 14, boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)', overflow: 'hidden', zIndex: 200,
            animation: 'modalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>{displayName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{displayEmail}</div>
              {profile?.role_display && (
                <div style={{
                  display: 'inline-block', marginTop: 6, fontSize: 10, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 6,
                  background: 'var(--primary-light)', color: 'var(--primary)',
                }}>{profile.role_display}</div>
              )}
            </div>
            <Button
              variant="ghost"
              icon="log-out"
              onClick={() => { setShowUserMenu(false); logout(); }}
              style={{
                width: '100%',
                justifyContent: 'flex-start',
                color: '#ef4444',
                borderRadius: 0,
                padding: '10px 16px',
                height: 40,
              }}
            >
              Đăng xuất
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
