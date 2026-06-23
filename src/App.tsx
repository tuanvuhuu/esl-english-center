import { useState, useEffect } from 'react';
import { Sidebar, Header, ToastProvider, ConfirmProvider } from './components';
import { useNavCounts } from './hooks';
import { pageTitles, pageComponents } from './config/routers';
import { useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Login } from './pages/Login/Login';
import { Landing } from './pages/Landing/Landing';

export default function App() {
  const { session, loading: authLoading } = useAuth();
  const navCounts = useNavCounts();
  const [page, setPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState<any>(null);
  const navigateTo = (targetPage: string, params?: any) => {
    setPage(targetPage);
    setPageParams(params || null);
  };
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(true);
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');

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
    return (
      <ToastProvider>
        <ConfirmProvider>
          {publicView === 'landing'
            ? <Landing onEnterApp={() => setPublicView('login')} />
            : <Login />}
        </ConfirmProvider>
      </ToastProvider>
    );
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background glow blobs */}
      <div
        className="glow-blob"
        style={{
          top: '-150px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'var(--gradient-glow-1)',
        }}
      />
      <div
        className="glow-blob"
        style={{
          bottom: '-150px',
          left: '-50px',
          width: '600px',
          height: '600px',
          background: 'var(--gradient-glow-2)',
        }}
      />

      <Sidebar
        activePage={page}
        onNavigate={navigateTo}
        collapsed={isMobile ? !mobileSidebarOpen : sidebarCollapsed}
        onToggle={isMobile ? (v: boolean) => setMobileSidebarOpen(v) : (v: boolean) => setSidebarCollapsed(v)}
        isMobile={isMobile}
        counts={navCounts as Record<string, number>}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', position: 'relative', zIndex: 1 }}>
        <Header
          title={pageTitles[page] || 'ESL English Center'}
          isMobile={isMobile}
          onMenuClick={() => setMobileSidebarOpen(false)}
          onNavigate={navigateTo}
        />
        <main style={{ flex: 1, overflow: 'auto', padding: isMobile ? 16 : 24 }}>
          {(() => {
            if (page === 'dashboard') {
              const DashboardComponent = pageComponents.dashboard as React.ComponentType<{ onNavigate: (page: string, params?: any) => void }>;
              return <DashboardComponent onNavigate={navigateTo} />;
            }
            const PageComponent = pageComponents[page];
            if (PageComponent) {
              const ComponentWithProps = PageComponent as React.ComponentType<{ params?: any; onNavigate?: (page: string, params?: any) => void }>;
              return <ComponentWithProps params={pageParams} onNavigate={navigateTo} />;
            }
            const DefaultDashboard = pageComponents.dashboard as React.ComponentType<{ onNavigate: (page: string, params?: any) => void }>;
            return <DefaultDashboard onNavigate={navigateTo} />;
          })()}
        </main>
      </div>
    </div>
    </AppProvider>
    </ConfirmProvider>
    </ToastProvider>
  );
}
