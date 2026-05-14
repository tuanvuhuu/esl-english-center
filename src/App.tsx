import { useState, useEffect } from 'react';
import { Sidebar, Header, ToastProvider, ConfirmProvider } from './components';
import { useNavCounts } from './hooks';
import { pageTitles, pageComponents } from './config/routers';
import { useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Login } from './pages/Login/Login';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const navCounts = useNavCounts();
  const [page, setPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);

  useEffect(() => {
    const h = () => {
      const m = window.innerWidth < 768;
      setIsMobile(m);
      if (!m) setMobileSidebarOpen(true);
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', fontFamily: 'var(--font)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #FF6B35, #e85d04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
          }}>E</div>
          <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <ToastProvider><ConfirmProvider><Login /></ConfirmProvider></ToastProvider>;
  }

  return (
    <ToastProvider>
    <ConfirmProvider>
    <AppProvider>
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: 'var(--bg)',
        fontFamily: 'var(--font)',
        transition: 'background 0.35s',
      }}
    >
      <Sidebar
        activePage={page}
        onNavigate={setPage}
        collapsed={isMobile ? !mobileSidebarOpen : sidebarCollapsed}
        onToggle={isMobile ? (v: boolean) => setMobileSidebarOpen(v) : (v: boolean) => setSidebarCollapsed(v)}
        isMobile={isMobile}
        counts={navCounts}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh' }}>
        <Header
          title={pageTitles[page] || 'ESL English Center'}
          isMobile={isMobile}
          onMenuClick={() => setMobileSidebarOpen(false)}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? 16 : 24 }}>
          {(() => {
            const PageComponent = pageComponents[page];
            return PageComponent ? <PageComponent /> : <pageComponents.dashboard />;
          })()}
        </main>
      </div>
    </div>
    </AppProvider>
    </ConfirmProvider>
    </ToastProvider>
  );
}
