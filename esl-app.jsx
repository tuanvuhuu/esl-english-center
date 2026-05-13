/* ESL English Center — App Shell: Sidebar, Header, Layout, Routing + Dark Mode */

const NAV_ITEMS = [
  { section: 'CHÍNH' },
  { id: 'dashboard', icon: 'dashboard', label: 'Tổng quan', labelEn: 'Dashboard' },
  { section: 'QUẢN LÝ' },
  { id: 'students', icon: 'users', label: 'Học viên', labelEn: 'Students', badge: 245 },
  { id: 'teachers', icon: 'graduation', label: 'Giáo viên', labelEn: 'Teachers' },
  { id: 'classes', icon: 'book', label: 'Lớp học', labelEn: 'Classes' },
  { id: 'rooms', icon: 'building', label: 'Phòng học', labelEn: 'Rooms' },
  { section: 'HOẠT ĐỘNG' },
  { id: 'schedule', icon: 'calendar', label: 'Lịch học', labelEn: 'Schedule' },
  { id: 'attendance', icon: 'clipboard', label: 'Điểm danh', labelEn: 'Attendance' },
  { id: 'tests', icon: 'file-edit', label: 'Kiểm tra', labelEn: 'Tests' },
  { section: 'TÀI CHÍNH' },
  { id: 'finance', icon: 'wallet', label: 'Tài chính', labelEn: 'Finance' },
  { id: 'reports', icon: 'bar-chart', label: 'Báo cáo', labelEn: 'Reports' },
];

const BOTTOM_NAV = [
  { id: 'notifications', icon: 'bell', label: 'Thông báo', badge: 3 },
  { id: 'settings', icon: 'settings', label: 'Cài đặt' },
];

/* ─── Sidebar ─── */
const Sidebar = ({ activePage, onNavigate, collapsed, onToggle, isMobile }) => {
  const sidebarRef = React.useRef(null);
  const { mode } = useTheme();

  React.useEffect(() => {
    if (isMobile && !collapsed) {
      const h = (e) => { if (sidebarRef.current && !sidebarRef.current.contains(e.target)) onToggle(true); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }
  }, [collapsed, isMobile]);

  const renderNavItem = (item) => {
    if (item.section) {
      if (collapsed && !isMobile) return null;
      return <div key={item.section} style={{ padding: '20px 16px 8px', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--sidebar-text)', opacity: 0.5, textTransform: 'uppercase' }}>{item.section}</div>;
    }
    const isActive = activePage === item.id;
    const showLabel = !collapsed || isMobile;
    return (
      <button key={item.id} onClick={() => { onNavigate(item.id); if (isMobile) onToggle(true); }}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: collapsed && !isMobile ? '12px 0' : '11px 16px',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          border: 'none', borderRadius: 12, cursor: 'pointer',
          background: isActive ? 'var(--primary-15)' : 'transparent',
          color: isActive ? 'var(--primary)' : 'var(--sidebar-text)',
          fontSize: 14, fontWeight: isActive ? 700 : 500, fontFamily: 'var(--font)',
          transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative', textAlign: 'left',
          margin: collapsed && !isMobile ? '2px 8px' : '2px 0',
          transform: isActive ? 'scale(1)' : 'scale(1)',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? 'var(--primary-15)' : 'transparent'; }}
      >
        <Icon name={item.icon} size={20} />
        {showLabel && <span style={{ flex: 1 }}>{item.label}</span>}
        {showLabel && item.badge && (
          <span style={{ background: 'var(--primary)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, minWidth: 20, textAlign: 'center' }}>{item.badge}</span>
        )}
        {!showLabel && item.badge && (
          <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
        )}
      </button>
    );
  };

  return (
    <>
      {isMobile && !collapsed && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 998, animation: 'fadeIn 0.25s ease' }} />}
      <aside ref={sidebarRef} style={{
        width: isMobile ? 280 : (collapsed ? 72 : 260),
        height: '100vh', background: 'var(--sidebar)',
        display: 'flex', flexDirection: 'column',
        transition: isMobile ? 'transform 0.35s cubic-bezier(.4,0,.2,1)' : 'width 0.3s cubic-bezier(.4,0,.2,1), background 0.35s',
        position: isMobile ? 'fixed' : 'sticky', top: 0, zIndex: 999,
        transform: isMobile ? (collapsed ? 'translateX(-100%)' : 'translateX(0)') : 'none',
        overflow: 'hidden', flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed && !isMobile ? '20px 0' : '20px 20px',
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
          borderBottom: '1px solid var(--sidebar-border)', minHeight: 72,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #FF6B35, #FF8F65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
          }}>E</div>
          {(!collapsed || isMobile) && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>ESL English</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Center Management</div>
            </div>
          )}
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: collapsed && !isMobile ? '8px 0' : '8px 12px' }}>
          {NAV_ITEMS.map(renderNavItem)}
        </nav>

        <div style={{ padding: collapsed && !isMobile ? '8px 0' : '8px 12px', borderTop: '1px solid var(--sidebar-border)' }}>
          {BOTTOM_NAV.map(renderNavItem)}
        </div>

        <div style={{
          padding: collapsed && !isMobile ? '16px 0' : '16px 20px',
          borderTop: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
        }}>
          <Avatar initials="AD" size={36} color="var(--primary)" />
          {(!collapsed || isMobile) && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Quản trị viên</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

/* ─── Header ─── */
const Header = ({ title, onMenuClick, isMobile }) => {
  const [searchVal, setSearchVal] = React.useState('');
  const [showNotif, setShowNotif] = React.useState(false);
  const { mode, toggle: toggleTheme } = useTheme();
  const notifRef = React.useRef(null);

  React.useEffect(() => {
    const h = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header style={{
      height: 72, background: 'var(--header)', borderBottom: '1px solid var(--header-border)',
      display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 100, transition: 'background 0.35s, border-color 0.35s',
    }}>
      {isMobile && (
        <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', padding: 4, display: 'flex' }}><Icon name="menu" size={24} /></button>
      )}

      <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', margin: 0, whiteSpace: 'nowrap' }}>{title}</h1>
      <div style={{ flex: 1 }} />

      {/* Search */}
      {!isMobile && (
        <div style={{ position: 'relative', maxWidth: 320, flex: 1 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }}><Icon name="search" size={16} /></div>
          <input value={searchVal} onChange={e => setSearchVal(e.target.value)} placeholder="Tìm học viên, lớp, giáo viên..."
            style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1.5px solid var(--border)', borderRadius: 12, fontSize: 13, fontFamily: 'var(--font)', color: 'var(--text-1)', outline: 'none', background: 'var(--input-bg-subtle)', transition: 'all 0.2s', boxSizing: 'border-box' }}
            onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.background = 'var(--input-bg)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,107,53,0.08)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--input-bg-subtle)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      )}

      {/* Dark Mode Toggle */}
      <button onClick={toggleTheme} style={{
        background: 'var(--hover-bg)', border: '1.5px solid var(--border)', borderRadius: 12,
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-2)', transition: 'all 0.25s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--hover-bg)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <Icon name={mode === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>

      {/* Notifications */}
      <div ref={notifRef} style={{ position: 'relative' }}>
        <button onClick={() => setShowNotif(!showNotif)} style={{
          position: 'relative', background: showNotif ? 'var(--primary-light)' : 'var(--hover-bg)',
          border: '1.5px solid ' + (showNotif ? 'var(--primary)' : 'var(--border)'),
          borderRadius: 12, width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: showNotif ? 'var(--primary)' : 'var(--text-2)', transition: 'all 0.2s',
        }}>
          <Icon name="bell" size={18} />
          <span style={{ position: 'absolute', top: -2, right: -2, background: '#EF4444', color: '#fff', fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--header)' }}>3</span>
        </button>
        {showNotif && (
          <div style={{
            position: 'absolute', right: 0, top: 52, width: 360, background: 'var(--card)', borderRadius: 16,
            boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', overflow: 'hidden', zIndex: 200,
            animation: 'modalIn 0.25s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>Thông báo</span>
              <Badge variant="primary">3 mới</Badge>
            </div>
            {NOTIFICATIONS_DATA.slice(0, 4).map(n => (
              <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', background: n.read ? 'var(--card)' : 'var(--activity-warm)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? 'var(--card)' : 'var(--activity-warm)'}>
                <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: 'var(--text-1)', marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{n.desc}</div>
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>{n.time}</div>
              </div>
            ))}
            <div style={{ padding: 12, textAlign: 'center' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font)' }}>Xem tất cả →</button>
            </div>
          </div>
        )}
      </div>

      {/* User */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 6px 6px', borderRadius: 12, background: 'var(--hover-bg)', border: '1.5px solid var(--border)' }}>
          <Avatar initials="AD" size={32} color="var(--primary)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>Admin</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>admin@esl.edu.vn</div>
          </div>
        </div>
      )}
    </header>
  );
};

/* ─── Page Transition ─── */
const PageTransition = ({ page, children }) => {
  const [rendered, setRendered] = React.useState(children);
  const [anim, setAnim] = React.useState('page-enter');
  const prevPage = React.useRef(page);

  React.useEffect(() => {
    if (page !== prevPage.current) {
      setAnim('');
      const t = setTimeout(() => { setRendered(children); setAnim('page-enter'); }, 20);
      prevPage.current = page;
      return () => clearTimeout(t);
    } else {
      setRendered(children);
    }
  }, [page, children]);

  return <div key={page} className={anim}>{rendered}</div>;
};

/* ─── Main App ─── */
const App = () => {
  const [page, setPage] = React.useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(true);

  React.useEffect(() => {
    const h = () => { const m = window.innerWidth < 768; setIsMobile(m); if (!m) setMobileSidebarOpen(true); };
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, []);

  const pageTitles = {
    dashboard: 'Tổng quan', students: 'Quản lý học viên', teachers: 'Quản lý giáo viên',
    classes: 'Quản lý lớp học', rooms: 'Quản lý phòng học', schedule: 'Lịch học',
    attendance: 'Điểm danh', tests: 'Kiểm tra & Thi', finance: 'Quản lý tài chính',
    reports: 'Báo cáo & Thống kê', notifications: 'Thông báo', settings: 'Cài đặt hệ thống',
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardView />;
      case 'students': return <StudentsView />;
      case 'teachers': return <TeachersView />;
      case 'classes': return <ClassesView />;
      case 'schedule': return <ScheduleView />;
      case 'finance': return <FinanceView />;
      case 'rooms': return <RoomsView />;
      case 'attendance': return <AttendanceView />;
      case 'tests': return <TestsView />;
      case 'reports': return <ReportsView />;
      case 'notifications': return <NotificationsView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <ThemeProvider>
      <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)', transition: 'background 0.35s' }}>
        <Sidebar activePage={page} onNavigate={setPage}
          collapsed={isMobile ? mobileSidebarOpen : sidebarCollapsed}
          onToggle={isMobile ? setMobileSidebarOpen : setSidebarCollapsed}
          isMobile={isMobile}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
          <Header title={pageTitles[page] || 'ESL English Center'} isMobile={isMobile} onMenuClick={() => setMobileSidebarOpen(false)} />
          <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? 16 : 24 }}>
            <PageTransition page={page}>
              {renderPage()}
            </PageTransition>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};

Object.assign(window, { App, Sidebar, Header, PageTransition });
