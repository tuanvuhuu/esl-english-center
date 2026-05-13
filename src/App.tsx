import { useState, useEffect } from 'react';
import { Sidebar, Header } from './components';
import { pageTitles, pageComponents } from './config/routers';

export default function App() {
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

  return (
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
  );
}
